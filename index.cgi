#!/usr/bin/perl
####################################
##               ゆとチャadv.     ##
##          by ゆとらいず工房     ##
##    https://yutorize.2-d.jp     ##
####################################
use strict;
use warnings;
use utf8;
use open ":utf8";
use open ":std";
use CGI::Carp qw(fatalsToBrowser);

### バージョン #######################################################################################
our $ver = "0.14.0";

### 設定読込 #########################################################################################
require './config.cgi';


### 各処理へ移動 #####################################################################################
our %in = getParam();

my $mode = $in{'mode'};

if    ($mode eq 'write') { require './lib/pl/write.pl'; }  #書込
elsif ($mode eq 'read')  { require './lib/pl/read.pl'; }   #読込
elsif ($mode eq 'room')  { require './lib/pl/room.pl'; }   #ルーム表示
elsif ($mode eq 'load')  { require './lib/pl/load.pl'; }   #ルームロード
elsif ($mode eq 'create'){ require './lib/pl/create.pl'; } #ルーム作成
elsif ($mode eq 'logs')  { require './lib/pl/logs.pl'; }   #過去ログ
elsif ($mode eq 'reset') { require './lib/pl/reset.pl'; }  #ルームリセット
elsif ($mode eq 'change'){ require './lib/pl/change.pl'; } #ルーム設定変更
elsif ($mode eq 'getfilename') { message(getFileNameDate()); }
else { require './lib/pl/list.pl'; } #部屋一覧

print "Content-type:text/plain; charset=UTF-8\n\n";
print "入力がありません";

### 共通処理 ########################################################################################
## パラメータ取得
sub getParam {
  my %params;
  my $query;
  if($ENV{'REQUEST_METHOD'} eq "POST") {
    read(STDIN, $query, $ENV{'CONTENT_LENGTH'});
  }
  else {
    $query = $ENV{'QUERY_STRING'};
  }

  my @pairs = split('&', $query);
  foreach (@pairs){
    my ($name, $value) = split('=', $_);
    $value =~ tr/+/ /;
    $value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg;
    $params{$name} = $value;
  }
  
  return %params;
}

## 計算処理
sub calc {
  my $formula = shift;
  $formula =~ s/[^0-9\.\+\-\*\/\(\)%]//gi; #数字と括弧と算術演算子以外は消す
  $formula =~ tr/\+\-\/%//s; #指定記号の連続は一つにまとめる
  
  return eval($formula);
}

## 暗号化 
sub e_crypt {
  my $plain = shift;
  my $s;
  my @salt = ('0'..'9','A'..'Z','a'..'z','.','/');
  1 while (length($s .= $salt[rand(@salt)]) < 8);
  return crypt($plain,index(crypt('a','$1$a$'),'$1$a$') == 0 ? '$1$'.$s.'$' : $s);
}
sub c_crypt {
  my($plain,$crypt) = @_;
  return ($plain ne '' && $crypt ne '' && crypt($plain,$crypt) eq $crypt);
}

## ファイル有無チェック
sub getFileNameDate {
  use Fcntl;
  my $roomexists = exists($set::rooms{$::in{'room'}}) ? 1 : 0;
  my $logs_dir = $set::rooms{$::in{'room'}}{'logs-dir'} || $set::logs_dir;
  my $date;
  sysopen(my $RD, "./room/$::in{'room'}/log-all.dat", O_RDONLY);
  while(<$RD>){
    $date = (split(/<>/, $_))[1];
    next if ($date !~ m"^[0-9]{4}/[0-9]{2}/[0-9]{2}");
    last if $date;
  }
  close($RD);
  $date =~ s"^([0-9]{4})/([0-9]{2})/([0-9]{2}) .+$"$1$2$3";
  error('ログから日付が取得できませんでした') if !$date;
  my $filename = $date;
  $filename .= $::in{'room'} if $set::logname_id_add && $roomexists;
  my $num = 0;
  while (-f "${logs_dir}/${filename}_${num}.dat"){
    $num++;
  }
  return "${filename}_${num}";
}

## メッセージ・データ
sub message {
  print "Content-type:application/json; charset=UTF-8\n\n";
  print '{"status":"ok","filename":"'.$_[0].'"}';
  exit;
}

## エラー
sub error {
  if($in{'mode'} =~ /write|read|reset|change/){
    print "Content-type:application/json; charset=UTF-8\n\n";
    print '{"status":"error","text":"'.$_[0].'"}';
  }
  else {
    print "Content-type:text/plain; charset=UTF-8\n\n";
    print $_[0];
  }
  exit;
}