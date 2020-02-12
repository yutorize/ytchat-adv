use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;

###################
### ルームリセット


error('パスワードが一致しません') if ($set::password ne $::in{'password'});

my $dir = "./room/$::in{'room'}/";
my $logs_dir = $set::rooms{$::in{'room'}}{'logs-dir'} ? $set::rooms{$::in{'room'}}{'logs-dir'} : $set::logs_dir;

## ファイル名
my $filename;
if($::in{'filename'}){
  if($::in{'filename'} !~ /^[-0-9a-zA-Z_.]+$/){ error('ファイル名に使えない文字があります'); }
  $filename = "${logs_dir}/$::in{'filename'}.dat" if $::in{'filename'};
}
else {
  sysopen (my $RD, $dir.'log-all.dat', O_RDONLY);
  my $date;
  while(<$RD>){
    next if($_ =~ /^>/);
    $date = (split(/<>/, $_))[1];
    last if $date;
  }
  close($RD);
  $date =~ s<^([0-9]{4})/([0-9]{2})/([0-9]{2}) .+$><$1$2$3>;
  error('ログから日付が取得できませんでした') if !$date;
  $filename = $date;
  $filename .= $::in{'room'} if $set::logname_id_add;
  my $num = 0;
  while (-f "${logs_dir}/${filename}_${num}.dat"){
    $num++;
  }
  $filename = "${logs_dir}/${filename}_${num}.dat";
}

## ディレクトリチェック
if(!-d $logs_dir){
  mkdir $logs_dir;
}

error('同名のファイルが存在します') if (-f $filename); #上書きは避ける

## ログ生成
#sysopen (my $RD, $dir.'log-all.dat', O_RDONLY);
#sysopen (my $WR, $filename, O_WRONLY | O_TRUNC | O_CREAT, 0666);
#
#my @tabs = @{$set::rooms{$::in{'room'}}{'tab'}};
#my $before_tab;
#my $before_name;
#my $before_color;
#my $before_user;
#my %namecolor;
#print $WR "<h1>$set::rooms{$::in{'room'}}{'name'}</h1>\n";
#while(<$RD>){
#  my ($num, $date, $tab, $name, $color, $comm, $info, $system, $user) = split(/<>/, $_);
#  my $type = ($system =~ /^check|round/) ? 'dice' : ($system) ? $system : 'dice';
#     $type =~ s/:.*?$//;
#  my $game;
#  $user =~ s/<.+?>//;
#  $comm =~ s/<br>/\n/i;
#  print $WR "\nc\{${name}\} = $color\n" if $namecolor{$name} ne $color;
#  print $WR "\n\[$tabs[$tab]\]------------------------------" if $before_tab ne $tab;
#  print $WR "\n${name}:(".($user eq $name ? '' : $user)."):\n" if ($before_tab ne $tab || $before_name  ne $name || $before_color ne $color || $before_user  ne $user);
#  print $WR "$comm\n" if $comm;
#  print $WR "$type>$info\n" if $info;
#  
#  
#  $before_tab   = $tab;
#  $before_name  = $name;
#  $before_color = $namecolor{$name} = $color;
#  $before_user  = $user;
#}
#
#close($WR);
#close($RD);

use File::Copy 'move';
if(move($dir.'log-all.dat', $filename)){
  if($::in{'allReset'}){
    unlink $dir.'/room.dat';
    unlink $dir.'/log-key.dat';
    unlink $dir.'/log-pre.dat';
    unlink $dir."/log-num-$::in{'logKey'}.dat";
  }
}

print "Content-type:application/json; charset=UTF-8\n\n";
  print '{"status":"ok","text":"リセット完了"}';

exit;

1;