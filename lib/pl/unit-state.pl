use strict;
use utf8;
use open ":utf8";
use open ":std";
use Encode qw/encode decode/;
use JSON::PP;
use Clone qw(clone);

sub addUnitState {
    my $stateSettingsText = shift;
    my $conditionText = shift;

    my %stateSettings = %{parseStateSettings($stateSettingsText);};
    my @targetUnits = @{parseStateTargetUnits($conditionText);};

    my %unitStates = %{loadUnitStates();};

    my @resolvedUnitNames = ();

    my %duration = %{$stateSettings{duration}};
    if (!(defined($duration{value}) && $duration{value} ne '' && $duration{value} <= 0)) {
        my $currentRound = loadCurrentRound();
        $stateSettings{occurrenceRound} = $currentRound;
        my $stateSourceName = $stateSettings{source};

        for my $targetUnitName (@targetUnits) {
            my @states;
            if ($unitStates{$targetUnitName}) {
                @states = @{$unitStates{$targetUnitName}};
            }
            else {
                @states = ();
            }

            my %state = %{clone(\%stateSettings)};
            $state{id} = random_key(16);
            $state{source} = $targetUnitName if $stateSourceName eq '#self';

            push(@states, \%state);
            $unitStates{$targetUnitName} = \@states;

            push(@resolvedUnitNames, $targetUnitName);
        }
    }

    saveUnitStates(\%unitStates);

    my %result = ();
    $result{state} = \%stateSettings;
    $result{targets} = \@resolvedUnitNames;
    $result{all} = \%unitStates;

    return %result;
}

sub parseStateSettings {
    my $source = shift;

    my %stateSettings = ();

    if ($source =~ s/\{\s*name\s*=\s*(.+?)\s*\}//) {
        $stateSettings{name} = $1;
    }
    else {
        error "Error: 状態の名称が指定されていません。";
    }

    if ($source =~ s/\{\s*source\s*=\s*(.+?)\s*\}//) {
        $stateSettings{source} = $1;
    }

    if ($source =~ s/\{\s*duration\s*=\s*(.+?)\s*\}//) {
        my $duration = $1;

        if ($duration =~ /^(\d+)?(.+?)?$/) {
            my %duration = ();
            $duration{value} = $1;
            $duration{unit} = $2;
            $stateSettings{duration} = \%duration;
        }
    }
    else {
        error "Error: 状態の持続期間が指定されていません。";
    }

    if ($source =~ s/\{\s*icon\s*=\s*(.+?)\s*\}//) {
        my $icon = $1;

        if ($icon =~ /^(.+?):(buff|debuff|other)?$/) {
            my %icon = ();
            $icon{category} = $1;
            $icon{direction} = $2 if $2 ne '';
            $stateSettings{icon} = \%icon;
        }
        else {
            error "Error: 状態アイコンの指定が不正です。";
        }
    }
    else {
        error "Error: 状態のアイコンが指定されていません。";
    }

    if ($source =~ s/\{\s*description\s*=\s*(.+?)\s*\}//) {
        $stateSettings{description} = $1;
        $stateSettings{description} =~ s/&lt;br&gt;/\n/ig;
    }

    return \%stateSettings;
}

sub parseStateTargetUnits {
    my $source = shift;

    my @units = ();

    for my $part (split(/\s+|\s+/, $source)) {
        if ($part =~ /^\s*unit\s*:\s*(.+?)\s*$/) {
            my $unitName = $1;
            push(@units, $unitName);
        }
    }

    return \@units;
}

sub modifyUnitState {
    my $modificationText = shift;
    my $conditionText = shift;

    my %modification = %{parseStateModificationContent($modificationText);};
    my %condition = parseStateModificationCondition($conditionText);

    my %unitStates = %{loadUnitStates();};
    my @differences = ();

    for my $unitName (keys(%unitStates)) {
        if ($condition{unit} && $unitName ne $condition{unit}) {
            next;
        }

        my @states = @{$unitStates{$unitName}};
        my $stateCount = @states;

        my @modifiedStates = ();

        for my $i (0 .. ($stateCount - 1)) {
            next if !defined($states[$i]);
            my %state = %{$states[$i]};

            if ($condition{id}) {
                if ($state{id} ne $condition{id}) {
                    push(@modifiedStates, \%state);
                    next;
                }
            }

            if ($condition{name}) {
                if ($state{name} ne $condition{name}) {
                    push(@modifiedStates, \%state);
                    next;
                }
            }

            if ($condition{source}) {
                if ($state{source} ne $condition{source}) {
                    push(@modifiedStates, \%state);
                    next;
                }
            }

            if ($condition{durationUnit}) {
                my %duration = %{$state{duration}};

                if ($duration{unit} ne $condition{durationUnit}) {
                    push(@modifiedStates, \%state);
                    next;
                }
            }

            my %modificationResult = %{applyStateModification(\%state, \%modification);};
            my %difference = %{$modificationResult{difference}};
            my $differenceCount = keys %difference;
            if ($differenceCount == 0) {
                push(@modifiedStates, \%state);
                next;
            }

            my $stateAddress;

            my %modifiedState = %{$modificationResult{state}};
            my %duration = %{$modifiedState{duration}};
            if (defined($duration{value}) && $duration{value} ne '' && $duration{value} <= 0) {
                $stateAddress = undef;
            }
            else {
                $stateAddress = \%modifiedState;
            }

            my %d = ();
            $d{unit} = $unitName;
            $d{stateId} = $state{id};
            $d{stateName} = $state{name};
            $d{difference} = $modificationResult{difference};
            push(@differences, \%d);

            push(@modifiedStates, $stateAddress) if defined($stateAddress);
        }

        $unitStates{$unitName} = \@modifiedStates;
    }

    saveUnitStates(\%unitStates);

    my %result = ();
    $result{differences} = \@differences;
    $result{all} = \%unitStates;

    return %result;
}

sub parseStateModificationContent {
    my $source = shift;

    if ($source =~ /^(duration)\s*(=|\+=|-=)\s*(.+?)$/) {
        my %modification = ();
        $modification{propertyName} = $1;
        my $operator = $2;
        my $value = $3;

        if ($operator eq '=') {
            $modification{mode} = 'assignment';
        }
        elsif ($operator eq '+=') {
            $modification{mode} = 'increment';
        }
        elsif ($operator eq '-=') {
            $modification{mode} = 'decrement';
        }
        else {
            error "Error: Unexpected operator '$operator'";
        }

        if ($value =~ /^(\d+)?(.+?)?$/) {
            my %value = ();
            $value{value} = $1;
            $value{unit} = $2;
            $modification{value} = \%value;
        }

        return \%modification;
    }

    error "Error: 操作内容が不正です。";
}

sub parseStateModificationCondition {
    my $source = shift;

    my %condition = ();

    if ($source =~ s/{\s*id\s*:\s*(.+?)\s*}//) {
        $condition{id} = $1;
    }
    else {
        if ($source =~ s/{\s*name\s*:\s*(.+?)\s*}//) {
            $condition{name} = $1;
        }

        if ($source =~ s/{\s*source\s*:\s*(.+?)\s*}//) {
            $condition{source} = $1;
        }

        if ($source =~ s/{\s*unit\s*:\s*(.+?)\s*}//) {
            $condition{unit} = $1;
        }

        if ($source =~ s/{\s*durationUnit\s*:\s*(.+?)\s*}//) {
            $condition{durationUnit} = $1;
        }
    }

    my @keys = keys %condition;
    my $count = @keys;
    if ($count == 0) {
        error "Error: 操作対象（条件）が指定されていません。";
    }

    return %condition;
}

sub applyStateModification {
    my %state = %{shift;};
    my %modification = %{shift;};

    my %difference = ();

    if ($modification{propertyName} eq 'duration') {
        my %duration = %{$state{duration}};
        my %value = %{$modification{value}};

        my %diff = ('before' => $duration{value});
        my $modified = 0;

        if ($modification{mode} eq 'assignment') {
            $duration{value} = $value{value};
            my %u = ('before' => $duration{unit}, 'after' => $value{unit});
            $diff{unit} = \%u;
            $duration{unit} = $value{unit};
            $modified = 1;
        }
        elsif ($value{unit} eq $duration{unit} && $modification{mode} eq 'increment') {
            $duration{value} += $value{value};
            $modified = 1;
        }
        elsif ($value{unit} eq $duration{unit} && $modification{mode} eq 'decrement') {
            $duration{value} -= $value{value};
            $modified = 1;
        }
        else {
            $modified = 0;
        }

        if ($modified > 0) {
            $diff{after} = $duration{value};
            $diff{unit} = $value{unit} if !defined($diff{unit});

            $difference{duration} = \%diff;
            $state{duration} = \%duration;
        }
    }
    else {
        error "Error: Unexpected property '$modification{propertyName}'";
    }

    my %result = ();
    $result{state} = \%state;
    $result{difference} = \%difference;

    return \%result;
}

sub removeUnitState {
    my $conditionText = shift;

    return modifyUnitState('duration=0', $conditionText);
}

sub loadCurrentRound {
    sysopen(my $FH, "./room/$::in{'room'}/room.dat", O_RDONLY) or error "room.datが開けません";
    my %data = %{decode_json(encode('utf8', (join '', <$FH>)))};
    close($FH);

    return $data{round} || 0;
}

sub loadUnitStates {
    sysopen(my $FH, "./room/$::in{'room'}/room.dat", O_RDONLY) or error "room.datが開けません";
    my %data = %{decode_json(encode('utf8', (join '', <$FH>)))};
    close($FH);

    my %unitStates = ();

    if ($data{unit}) {
        my %units = %{$data{unit}};

        for my $unitName (keys %units) {
            my %unit = %{$units{$unitName}};

            if ($unit{states}) {
                $unitStates{$unitName} = $unit{states};
            }
        }
    }

    return \%unitStates;
}

sub saveUnitStates {
    my %unitStates = %{shift;};

    sysopen(my $FH, "./room/$::in{'room'}/room.dat", O_RDWR) or error "room.datが開けません";
    flock($FH, 2);
    my %data = %{decode_json(encode('utf8', (join '', <$FH>)))};
    seek($FH, 0, 0);

    if ($data{unit}) {
        my %units = %{$data{unit}};

        for my $unitName (keys %unitStates) {
            if ($units{$unitName}) {
                my %unit = %{$units{$unitName}};
                $unit{states} = $unitStates{$unitName};
                $units{$unitName} = \%unit;
            }
        }

        $data{unit} = \%units;
    }

    print $FH decode('utf8', encode_json \%data);
    truncate($FH, tell($FH));
    close($FH);
}

sub random_key {
    my @char = (0 .. 9, 'a' .. 'z', 'A' .. 'Z');
    my $s;
    1 while (length($s .= $char[rand(@char)]) < $_[0]);
    return $s;
}

1;
