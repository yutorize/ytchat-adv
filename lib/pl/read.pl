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
  chomp;
  $_ =~ s/\\/\\\\/g;
  $_ =~ s/"/\\"/g;
  $_ =~ s/\t/\\t/;
  my ($num, $date, $tab, $name, $color, $comm, $info, $system, $user, $address) = split(/<>/, $_);
  last if $::in{'num'} > $num - 1;
  my (undef, $time) = split(/ /, $date);
  my ($username, $userid) = $user =~ /^(.*)<([0-9a-zA-Z]+?)>$/;
  my $game;
  my $code;
  my @infos = split(/<br>/,$info);
  foreach (@infos){
    { $_ =~ s/\<\<(.*)$/$code = $1; ''/e; }
    if($system =~ /^choice/){
      $_ =~ s#(\[.*?\])#<i>$1</i>#g;
    }
    elsif($system =~ /^dice/){
      $_ =~ s#(\[.*?\])#<i>$1</i>#g;
      $_ =~ s# = ([0-9a-z.∞]+)$# = <strong>$1</strong>#gi;
      $_ =~ s# = ([0-9a-z.]+)# = <b>$1</b>#gi;
      #クリティカルをグラデにする
      my $crit = $_ =~ s/(クリティカル!\])/$1<em>/g;
      while($crit > 0){ $_ .= "</em>"; $crit--; }
      $_ =~ s#\[([0-9,]+?)!!]#<em>[$1]</em>#g;
      #ファンブル用の色適用
      if($_ =~ /1ゾロ|ファンブル/){ $_ = "<em class='fail'>$_</em>"; }
      $_ =~ s#\[([0-9,]+?)\.\.\.\]#<em class='fail'>[$1]</em>#g;
      #
      $_ =~ s#\{(.*?)\}#{<span class='division'>$1</span>}#g;
    }
    if($system =~ /^unit/){
      $_ =~ s# (\[.*?\])# <i>$1</i>#g;
    }
  }
  $info = join('<br>', @infos);
  
  my $openlater;
  if($address =~ s/\#$//){ $openlater = 1; }
  
  my $line  = '{'
    . '"num":'       .$num
    . ',"date":"'    .$time.'"'
    . ',"tab":"'     .$tab.'"'
    . ',"userId":"'  .$userid.'"'
    . ',"userName":"'.$username.'"'
    . ',"name":"'    .$name.'"'
    . ',"color":"'   .$color.'"'
    . ',"comm":"'    .$comm.'"'
    . ($info   ? ',"info":"'   .$info.   '"' : '')
    . ($code   ? ',"code":"'   .$code.   '"' : '')
    . ($system ? ',"system":"' .$system. '"' : '')
    . ($address  ? ',"address":"'  .$address.  '"' : '')
    . ($openlater? ',"openlater":"'.$openlater.'"' : '')
    . '}';
  unshift(@lines, $line);
}
close($FH);

$" = ",";
print "Content-type:application/json; charset=UTF-8\n\n";
print "[@lines]";

exit;

1;