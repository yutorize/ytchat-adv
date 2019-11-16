use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;

###################
### 読み込み処理

my $dir = "./room/$::in{'room'}/";

my $logfile = 'log-pre.dat';
open(my $FH, '<', $dir.$logfile) or error "${logfile}が開けません";
my @lines;
foreach(<$FH>) {
  $_ =~ s/\\/\\\\/g;
  $_ =~ s/"/\\"/g;
  my ($num, $date, $tab, $name, $color, $comm, $info, $system, $user) = split(/<>/, $_);
  last if $::in{'num'} > $num - 1;
  my (undef, $time) = split(/ /, $date);
  my ($username, $userid) = $user =~ /^(.*)<([0-9a-zA-Z]+?)>$/;
  my $game;
  if($info){
    $info =~ s|(\[.*?\])|<i>$1</i>|g;
    $info =~ s| = ([0-9a-z.∞]+)$| = <strong>$1</strong>|gi;
    $info =~ s| = ([0-9a-z.]+)| = <b>$1</b>|gi;
    my $crit = () = $info =~ s/(クリティカル!\])/$1<em>/g; foreach(1 .. $crit){ $info .= "</em>"; } #クリティカルをグラデにする
    if($info =~ /1ゾロ|ファンブル/){ $info = "<em class='fail'>$info</em>"; }
    $info =~ s/\{(.*?)\}/{<span class='division'>$1<\/span>}/;
  }
  
  my $line  = '{'
    . '"num":'.$num
    . ',"date":"'  .$time.'"'
    . ',"tab":"'   .$tab.'"'
    . ',"userId":"'  .$userid.'"'
    . ',"userName":"'.$username.'"'
    . ',"name":"'  .$name.'"'
    . ',"color":"' .$color.'"'
    . ',"comm":"'  .$comm.'"'
    . ($info ? ',"info":"'.$info.'"' : '')
    . ($info && $game ? ',"game":"'.$game.'"' : '')
    . ($system ? ',"system":"'.$system.'"' : '')
    . '}';
  unshift(@lines, $line);
}
close($FH);

$" = ",";
print "Content-type:application/json; charset=UTF-8\n\n";
print "[@lines]";

exit;

1;