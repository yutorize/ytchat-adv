use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use HTML::Template;
use Encode qw/encode decode/;
use JSON::PP;

error('ユーザーによるゲームルームの作成が許可されていません。') if !$set::userroom_on;

my %rooms;
if(sysopen(my $FH, './room/list.dat', O_RDONLY)){
  my $text = join('', <$FH>);
  %rooms = %{ decode_json(encode('utf8', $text)) } if $text;
  close($FH);
}
foreach my $key (keys %set::rooms){
  $rooms{$key} = $set::rooms{$key};
}

#部屋ID
my $id = '@'.random_key(6);
while ($rooms{$id}) {
  $id = '@'.random_key(6);
}

foreach (%::in) { $::in{$_} = decode('utf8', $::in{$_}); }

my $game = ($::in{'game'} eq 'bcdice') ? $::in{'bcdice-game'} : $::in{'game'};
my @tab = $::in{'tab'} ? split(/[ 　]/, $::in{'tab'}) : ();
my @status = $::in{'status'} ? split(/[ 　]/, $::in{'status'}) : ();

{
  my %data;
  sysopen(my $FH, './room/list.dat', O_RDWR | O_CREAT) or error "list.datが開けません";
  flock($FH, 2);
  my $text = join('', <$FH>);
  %data = %{ decode_json(encode('utf8', $text)) } if $text;
  seek($FH, 0, 0);

  $data{$id} = {
    'name' => $::in{'name'},
    'pass' => ($::in{'pass'} ne '' ? e_crypt($::in{'pass'}) : undef),
    'game' => $game,
    'tab' => (@tab ? [@tab] : undef),
    'status' => (@status ? [@status] : undef),
    'bcdice-url' => $::in{'bcdice-url'},
  };

  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}

print "Location: ./?mode=room&id=${id}\n\n";

sub random_key {
  my @char = (0..9,'a'..'z','A'..'Z');
  my $s;
  1 while (length($s .= $char[rand(@char)]) < $_[0]);
  return $s;
}

1;