#!/usr/bin/perl
####################################
##               ゆとチャadv.     ##
##                version0.01     ##
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
our $ver = "0.01";

### 設定読込 #########################################################################################
require './config.cgi';


### 各処理へ移動 #####################################################################################
our %in = getParam();

my $mode = $in{'mode'};

if    ($mode eq 'write') { require './lib/pl/write.pl'; }  #書込
elsif ($mode eq 'read')  { require './lib/pl/read.pl'; }   #読込
elsif ($mode eq 'room')  { require './lib/pl/room.pl'; }   #ルーム
elsif ($mode eq 'load')  { require './lib/pl/load.pl'; }   #ルームロード
elsif ($mode eq 'logs')  { require './lib/pl/logs.pl'; }   #過去ログ
elsif ($mode eq 'reset') { require './lib/pl/reset.pl'; }  #ルームリセット
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

## エラー
sub error {
  if($in{'mode'} =~ /write|read|reset/){
    print "Content-type:application/json; charset=UTF-8\n\n";
    print '{"status":"error","text":"'.$_[0].'"}';
  }
  else {
    print "Content-type:text/plain; charset=UTF-8\n\n";
    print $_[0];
  }
  exit;
}