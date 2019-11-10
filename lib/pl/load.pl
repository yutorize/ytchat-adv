use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;

###################
### ルームデータロード

my $dir = "room/$::in{'room'}/";

$" = ",";

open(my $FH, '<', $dir.'topic.dat') or error "topic.datが開けません";
my $topic = <$FH>;
close($FH);

open(my $FH, '<', $dir.'unit.dat') or error "unit.datが開けません";
my $units;
foreach (<$FH>){
  my ($num, $name, $color, $data) = split('<\|>', $_);
  my @values;
  foreach my $stt (split('<>', $data)) {
    my ($key, $value) = split(' ', $stt);
    push(@values, '"'.$key.'":"'.$value.'"');
  }
  $units .= '"'.$num.'": { "name":"'.$name.'", "color":"'.$color.'", "status":{'."@values".'} },';
}
close($FH);
$units =~ s/,$//;

$topic =~ s/"/\\"/;
print "Content-type:application/json; charset=UTF-8\n\n";
print "{";
print '"topic":"'.$topic.'",';
print '"tab": { "1":"メイン", "2":"サブ" },';
print '"unit": { '.$units.' }';
print "}";

exit;

1;