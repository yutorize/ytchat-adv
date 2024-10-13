#!/usr/bin/perl
####################################
##               ゆとチャadv.     ##
##          by ゆとらいず工房     ##
##    https://yutorize.2-d.jp     ##
####################################
use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use CGI::Carp qw(fatalsToBrowser);

### バージョン #######################################################################################
our $ver = "0.17.100";

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
  while (-f "${logs_dir}/${filename}_${num}.dat" || -d "${logs_dir}/_${filename}_${num}"){
    $num++;
  }
  return "${filename}_${num}";
}

## 文字装飾変換
sub tagConvert {
  my $comm = shift;
  $comm =~ s/<br>/\n/g;
  # ユーザー定義
  foreach my $hash (@set::replace_regex){
    foreach my $key (keys %{$hash}){
      my $value = ${$hash}{$key};
         $value =~ s/"/\\"/g;
      $key =~ s/&lt;/</; $key =~ s/&gt;/>/;
      $comm =~ s/${key}/"\"${value}\""/gee;
    }
  }
  foreach my $key (keys %set::replace_rule){
    my $qkey = quotemeta $key;
    $comm =~ s/${qkey}/$set::replace_rule{$key}/g;
  }
  
  $comm =~ s#&lt;hr&gt;\n?#<hr>#gi;
  $comm =~ s#&lt;ruby&gt;(.+?)&lt;rt&gt;(.*?)&lt;/ruby&gt;#<ruby>$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>#gi;

  $comm =~ s/(^・(?!・).+(\n|$))+/&listCreate($&)/egim;
  $comm =~ s/(?:^(?:\|(?:.*?))+\|[hc]?(?:\n|$))+/&tableCreate($&)/egim;

  1 while $comm =~ s#&lt;mi&gt;(.+?)&lt;/mi&gt;#<i class="serif">$1</i>#gis;
  1 while $comm =~ s#&lt;hide&gt;(.+?)&lt;/hide&gt;#<span class="hide">$1</span>#gis;
  1 while $comm =~ s#&lt;em&gt;(.+?)&lt;/em&gt;#<em>$1</em>#gis;
  1 while $comm =~ s#&lt;b&gt;(.*?)&lt;/b&gt;#<b>$1</b>#gis;
  1 while $comm =~ s#&lt;i&gt;(.*?)&lt;/i&gt;#<i>$1</i>#gis;
  1 while $comm =~ s#&lt;s&gt;(.*?)&lt;/s&gt;#<s>$1</s>#gis;
  1 while $comm =~ s#&lt;u&gt;(.*?)&lt;/u&gt;#<u>$1</u>#gis;
  1 while $comm =~ s#&lt;c:([0-9a-zA-Z\#]*?)&gt;(.*?)&lt;/c&gt;#<span style="color:$1">$2</span>#gis;
  1 while $comm =~ s#&lt;big&gt;(.*?)&lt;/big&gt;#<span class="large">$1</span>#gis;
  1 while $comm =~ s#&lt;small&gt;(.*?)&lt;/small&gt;#<span class="small">$1</span>#gis;
  
  1 while $comm =~ s#&lt;left&gt;(.*?)&lt;/left&gt;\n?#<div class="left">$1</div>#gis;
  1 while $comm =~ s#&lt;center&gt;(.*?)&lt;/center&gt;\n?#<div class="center">$1</div>#gis;
  1 while $comm =~ s#&lt;right&gt;(.*?)&lt;/right&gt;\n?#<div class="right">$1</div>#gis;
  
  1 while $comm =~ s#&lt;h([1-6])&gt;(.*?)&lt;/h\1&gt;\n?#<h$1>$2</h$1>#gis;
  
  # 自動リンク
  $comm =~ s#((?:\G|>)[^<]*?)(https?://[^\s\<]+)#$1<a href="$2" target="_blank">$2</a>#gi;
  
  $comm =~ s#\n#<br>#gi;
  
  return $comm;
}
sub listCreate {
  my $text = shift;
  $text =~ s/^・/<li>/gm;
  $text =~ s/\n//g;
  return "<ul>$text</ul>";
}
#テーブル
sub tableCreate {
  my $text = shift;
  my $output;
  my @data;
  foreach my $line (split("\n", $text)){
    if   ($line =~ /c$/){ $output .= tableColCreate($line); next; }
    elsif($line =~ /h$/){ $output .= tableHeaderCreate($line); next; }
    $line =~ s/^\|//;
    my @row = split('\|', $line);
    push(@data, [ @row ]);
  }
  my $row_num = 0;
  foreach my $row (@data){
    next if !@{$row};
    $output .= "<tr>";
    my $col_num = 0;
    my $colspan = 1;
    foreach my $col (@{$row}){
      my $rowspan = 1;
      my $td = 'td';
      while($data[$row_num+$rowspan][$col_num] eq '~'){ $rowspan++; }
      $col_num++;
      if   ($col eq '&gt;'){ $colspan++; next; }
      elsif($col eq '~')   { next; }
      elsif($col =~ s/^~//){ $td = 'th' }
      $output .= "<$td";
      if($colspan > 1){ $output .= ' colspan="'.$colspan.'"'; }
      if($rowspan > 1){ $output .= ' rowspan="'.$rowspan.'"'; }
      $output .= ">$col";
    }
    $output .= "</tr>";
    $row_num++;
  }
  return "<table>$output</table>";
}
sub tableColCreate {
  my @out;
  my @col = split(/\|/, $_[0]);
  foreach(@col){
    push (@out, &tableStyleCreate($_));
  }
  return '<colgroup>'.(join '', @out).'</colgroup>';
}
sub tableStyleCreate {
  if($_[0] =~ /([0-9]+)(px|em|\%)/){
    my $num = $1; my $type = $2;
    if   ($type eq 'px' && $num > 300){ $num = 300 }
    elsif($type eq 'em' && $num >  20){ $num =  20 }
    elsif($type eq  '%' && $num > 100){ $num = 100 }
    return "<col style=\"width:calc(${num}${type} + 1em)\">";
  }
  else { return '<col>' }
}
sub tableHeaderCreate {
  my $line = shift;
  my $output;
  $line =~ s/^\|//;
  $line =~ s/h$//;
  $output .= "<thead><tr>";
  my $colspan = 1;
  foreach my $col (split('\|', $line)){
    my $td = 'td';
    if   ($col eq '&gt;'){ $colspan++; next; }
    elsif($col =~ s/^~//){ $td = 'th' }
    $output .= "<$td";
    if($colspan > 1){ $output .= ' colspan="'.$colspan.'"'; }
    $output .= ">$col";
  }
  $output .= "</tr></thead>";
  return $output;
}

## タグ削除
sub tagDelete {
  my $text = $_[0];
  $text =~ s/<img alt="&#91;(.)&#93;"/[$1]<img /g;
  $text =~ s/<br>/ /g;
  $text =~ s/<.+?>//g;
  $text =~ s/"/&quot;/g;
  return $text;
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