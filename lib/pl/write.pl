use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use Encode qw/encode decode/;
use JSON::PP;

###################
### 書き込み処理

my $log_pre_max = 50;
my $dir = "./room/$::in{'room'}/";


if($::in{'room'} eq ''){ error "ルームIDがありません"; }
if($::in{'logKey'} eq ''){ error "ログKeyがありません"; }
if(!-d "room/".$::in{'room'}){ error "ルームがありません"; }
if(!$::in{'system'}){
  if($::in{'userId'} eq ''){ error "送信者が不明です"; }
  if($::in{'comm'} eq ''){ error "発言がありません"; }
}

foreach (%::in) {
  $::in{$_} = decode('utf8', $::in{$_});
  $::in{$_} =~ s/</&lt;/g;
  $::in{$_} =~ s/>/&gt;/g;
  $::in{$_} =~ s/\\/&#92;/g;
}

my @adds;

my @status = $::in{'status'} ? (split(' \| ', $::in{'status'}))
          # : $set::rooms{$::in{'room'}}{'status'} ? @{$set::rooms{$::in{'room'}}{'status'}}
          # : $set::games{$::in{'game'}}{'status'} ? @{$set::games{$::in{'game'}}{'status'}}
          # : ('HP','MP','他')
           : ();
my $stt_commands = join('|', @status);

$::in{'name'} =~ s/!SYSTEM/$::in{'player'}/;

# 入退室処理
if($::in{'system'} eq 'enter'){
  $::in{'name'} = "!SYSTEM";
  $::in{'comm'} = "<b style=\"color:$::in{'color'}\">$::in{'player'}</b>が入室しました";
  delete $::in{'color'};
  memberEdit('enter', $::in{'player'}, $::in{'userId'});
}
elsif($::in{'system'} eq 'exit'){
  $::in{'name'} = "!SYSTEM";
  $::in{'comm'} = "<b style=\"color:$::in{'color'}\">$::in{'player'}</b>が退室しました";
  delete $::in{'color'};
  memberEdit('exit', $::in{'player'}, $::in{'userId'});
}
else {
  memberEdit('enter', $::in{'player'}, $::in{'userId'});
  # ラウンド処理
  if($::in{'comm'} =~ s<^/round([+\-][0-9]|reset)(?:\s|$)><>i){
    my $num = roundChange($1);
    $::in{'name'} = "!SYSTEM";
    $::in{'comm'} = "ラウンドを".($num ? "変更（$1）" : 'リセット')." by $::in{'player'}";
    $::in{'info'} = "ラウンド: ${num}";
    $::in{'system'} = "round:".$num;
    delete $::in{'address'};
  }
  # トピック処理
  elsif($::in{'comm'} =~ s<^/topic(\s|$)><>i){
    topicEdit($::in{'comm'});
    $::in{'tab'} = '1';
    $::in{'system'} = 'topic';
    $::in{'name'} = "!SYSTEM";
    $::in{'info'} = "$::in{'comm'}";
    $::in{'comm'} = "トピックを".($::in{'info'} ? "変更" : "削除")." by $::in{'player'}";
    delete $::in{'color'};
    delete $::in{'address'};
  }
  # メモ処理
  elsif($::in{'comm'} =~ s<^/memo([0-9]*)(\s|$)><>i){
    my $new = $1 eq '' ? 1 : 0;
    error('メモの内容がありません。') if ($new && !$::in{'comm'});
    my $num = memoEdit($1, $::in{'comm'});
    $::in{'tab'} = '1';
    $::in{'system'} = 'memo:'.$num;
    $::in{'name'} = "!SYSTEM";
    $::in{'info'} = "$::in{'comm'}";
    $::in{'comm'} = "共有メモ".($num+1).'を'. ($new ? '追加' : ($::in{'info'} ? '更新' : "削除")) ." by $::in{'player'}";
    delete $::in{'address'};
  }
  # 挿絵
  elsif($::in{'comm'} =~ s<^/insert\s+(https?://.+)><>i){
    my $url = $1;
    #Google
    if($url =~ /^https?:\/\/drive\.google\.com\/file\/d\/(.+)\/view\?usp=sharing$/){
      $url = 'https://drive.google.com/uc?id=' . $1;
    }
    $::in{'system'} = 'image';
    $::in{'comm'} = '';
    $::in{'info'} = $url;
  }
  # BGM変更処理
  elsif($::in{'comm'} =~ s<^/bgmreset><>i){
    bgmEdit('','');
    $::in{'name'} = "!SYSTEM";
    $::in{'comm'} = "BGMを削除 by $::in{'player'}";
    $::in{'system'} = 'bgm';
    delete $::in{'color'};
  }
  elsif($::in{'comm'} =~ s<^/bgm(?:\s(.*?))?(?:\s([0-9]{1,3}))?\s+(https?://.+)><>i){
    my $url = $3;
    my $title = $1 || '無題';
    $2 =~ s/^0+//;
    my $volume = $2 || 100;
    #Youtube
    if($url =~ "https?://((www\.)?youtube\.com|youtu\.be)/"){
      if($url =~ /youtube\.com\/watch\?(?:.*?)v=(.+?)(?:&|$)/){
        $url = 'https://youtu.be/'.$1;
      }
      elsif($url =~ /youtu\.be\/(.+)$/){
      }
      else { error('動画IDを取得できませんでした'); }
    }
    #指定URL
    elsif($set::src_url_limit) {
      my $hit = 0;
      foreach my $domain (@set::src_url_list){
        next if !$domain;
        if($url =~ "^https?://$domain"){ $hit = 1; last; }
      }
      if(!$hit){ error('許可されていないURLです'); }
    }
    #Google
    if($url =~ /^https?:\/\/drive\.google\.com\/file\/d\/(.+)\/view\?usp=sharing$/){
      $url = 'https://drive.google.com/uc?id=' . $1;
    }
    bgmEdit($url,$title,$volume);
    $::in{'name'} = "!SYSTEM";
    $::in{'comm'} = "BGMを変更 by $::in{'player'}";
    $::in{'info'} = "$title";
    $::in{'system'} = 'bgm:'.$volume.':'.$url;
    delete $::in{'color'};
  }
  # 背景変更処理
  elsif($::in{'comm'} =~ s<^/bgreset><>i){
    bgEdit('','');
    $::in{'name'} = "!SYSTEM";
    $::in{'comm'} = "背景を削除 by $::in{'player'}";
    $::in{'system'} = 'bg';
    delete $::in{'color'};
  }
  elsif($::in{'comm'} =~ s<^/bg(?:\s(.*?))?\s+(https?://.+)><>i){
    my $url = $2;
    my $title = $1 || '無題';
    if($set::src_url_limit) {
      my $hit = 0;
      foreach my $domain (@set::src_url_list){
        next if !$domain;
        if($url =~ "^https?://$domain"){ $hit = 1; last; }
      }
      if(!$hit){ error('許可されていないURLです'); }
    }
    #Google
    if($url =~ /^https?:\/\/drive\.google\.com\/file\/d\/(.+)\/view\?usp=sharing$/){
      $url = 'https://drive.google.com/uc?id=' . $1;
    }
    bgEdit($url,$title);
    $::in{'name'} = "!SYSTEM";
    $::in{'comm'} = "背景を変更 by $::in{'player'}";
    $::in{'info'} = "$title";
    $::in{'system'} = 'bg:'.$url;
    delete $::in{'color'};
  }
  # チャットパレット更新
  elsif($::in{'comm'} =~ s<^/paletteupdate\s(.*)$><>is){
    paletteUpdate($::in{'name'}, $1);
    $::in{'system'} = 'palette';
  }
  # ユニット処理
  #チェック
  elsif($::in{'comm'} =~ s/^[@＠](check|uncheck)(?:\s|$)//i){
    my $check = $1 eq 'check' ? 1 : 0;
    $::in{'info'} = 'チェック：'.($check ? '✔' : '×');
    $::in{'system'} = "check:".$check;
    unitCheck($::in{'name'}, $check);
    delete $::in{'address'};
  }
  #レディチェック
  elsif($::in{'comm'} =~ s<^/ready(?:\s|$)><>i){
    $::in{'name'} = "!SYSTEM";
    $::in{'comm'} = "レディチェックを開始 by $::in{'player'}";
    $::in{'system'} = "ready";
    delete $::in{'color'};
    checkReset();
    delete $::in{'address'};
  }
  #新規
  elsif($::in{'comm'} =~ s/^(.*?) [@＠] new \s ( .*? )$//ixs){
    $::in{'name'} = $1 || $::in{'name'};
    ($::in{'info'}, $::in{'system'}) = unitMake($::in{'name'}, $2);
    delete $::in{'address'};
  }
  #削除
  elsif($::in{'comm'} =~ s/^(.*?)[@＠]delete$//i){
    my $name = $1 ? $1 : $::in{'name'};
    $::in{'name'} = "!SYSTEM";
    $::in{'comm'} = "ユニット「${name}」を削除 by $::in{'player'}";
    $::in{'system'} = "unit-delete:${name}";
    delete $::in{'color'};
    unitDelete($name);
    delete $::in{'address'};
  }
  #更新
  elsif($::in{'comm'} =~ s/^[@＠]statusupdate//s){
    ($::in{'info'}, $::in{'system'}) = unitCalcEdit($::in{'name'}, '');
    delete $::in{'address'};
  }
  #変更
  elsif($::in{'comm'} =~ s/^[@＠](((?:$stt_commands|メモ|memo)[\+＋\-－\/／=＝:：](?:"(?:.*?)"|(?:.*?))(?:\s|$))+)//s){
    ($::in{'info'}, $::in{'system'}) = unitCalcEdit($::in{'name'}, $1);
    delete $::in{'address'};
  }
  # BCDice処理
  elsif($::in{'bcdice'}){
    $::in{'comm'} =~ s/^(.*?(?:\s|$))//;
    $::in{'info'} = $::in{'bcdice'}.'<<'.$1;
    $::in{'system'} = 'dice';
  }
  # ダイス処理
  elsif(diceCodeCheck()){
    #なんもないよ
  }
}
error('書き込む情報がありません') if ($::in{'comm'} eq '' && $::in{'info'} eq '' && $::in{'system'} eq '');

# ダイスコード確認
sub diceCodeCheck {
  # ダイス処理
  if($::in{'comm'} =~ /^(?:
      [\@＠\$＄]
    | [a-zａ-ｚA-ZＡ-Ｚ0-9０-９\+＋\-－\*＊\/／\^＾\@＠\$＄#＃()（）]{2,}
    | 威力[0-9] | [rk][ァ-ヴ] | 成長
  )/ix){
    require './lib/pl/dice.pl';
    ($::in{'info'}, $::in{'system'}) = diceCheck($::in{'comm'});
    if($::in{'info'}){
      $::in{'comm'} =~ s/^(.*?(?:\s|$))//;
      $::in{'info'} .= '<<'.$1;
      return $::in{'info'};
    }
  }
  # ダイス末尾マッチ
  if($::in{'comm'} =~ /\s((?:
      [\@＠\$＄]
    | [a-zａ-ｚA-ZＡ-Ｚ0-9０-９\+＋\-－\*＊\/／\^＾\@＠\$＄#＃()（）]{2,}
    | 威力 | [rk][ァ-ヴ] | 成長
  )(?!.*\s).*)$/ix){
    require './lib/pl/dice.pl';
    ($::in{'info'}, $::in{'system'}) = diceCheck($1);
    if($::in{'info'}){
      $::in{'comm'} =~ s/\s((?!.*\s).*)$//;
      $::in{'info'} .= '<<'.$1;
      return $::in{'info'};
    }
  }
}

# 秘話
if($::in{'address'}){
  $::in{'name'} .= ' > '.$::in{'addressName'};
  $::in{'address'} .= $::in{'openlater'} ? '#' : '';
}

# タグ変換
$::in{'comm'} = tagConvert($::in{'comm'});

# 最終安全装置
$::in{$_} = finalSafetyMain($::in{$_}) foreach ('comm','info');
$::in{$_} = finalSafetySub($::in{$_})  foreach ('tab','name','color','system','player','userId','address');
sub finalSafetyMain {
  my $text = shift;
  $text =~ s/<>/&lt;&gt;/g; $text =~ s/\r\n?|\n/<br>/g;
  return $text;
}
sub finalSafetySub {
  my $text = shift;
  $text =~ s/<>/&lt;&gt;/g; $text =~ s/\r\n?|\n/ /g;
  return $text;
}

# 時間取得
my @time = localtime(time);
my $date = sprintf("%04d/%02d/%02d %02d:%02d:%02d", $time[5]+1900,$time[4]+1,$time[3],$time[2],$time[1],$time[0]);


# カウンター
sysopen(my $NUM, $dir."log-num-$::in{'logKey'}.dat", O_RDWR) or error "log-num-$::in{'logKey'}.datが開けません";
flock($NUM, 2);
my $counter = <$NUM>;
seek($NUM, 0, 0);

$counter++;

# 新規データ
my @posts;
push(@posts, "$counter<>$date<>$::in{'tab'}<>$::in{'name'}<>$::in{'color'}<>$::in{'comm'}<>$::in{'info'}<>$::in{'system'}<>$::in{'player'}<$::in{'userId'}><>$::in{'address'}<>\n");
# 追加データ
foreach my $add (@adds){
  $counter++;
  push(@posts, "$counter<>$date<>$::in{'tab'}<>$::in{'name'}<>$::in{'color'}<>$add->{'comm'}<>$add->{'info'}<>$add->{'system'}<>$::in{'player'}<$::in{'userId'}><>$::in{'address'}<>\n");
}

# 過去ログに追加
sysopen(my $LOG, $dir.'log-all.dat', O_WRONLY | O_APPEND) or error "log-all.datが開けません";
print $LOG join("", @posts);
close($LOG);

@posts = reverse @posts;

# 現在ログに追加
sysopen(my $FH, $dir.'log-pre.dat', O_RDWR) or error "log-pre.datが開けません";
flock($FH, 2);
my @lines = <$FH>;
seek($FH, 0, 0);
unshift (@lines, @posts);
for (0 .. $log_pre_max-1) {
  print $FH $lines[$_];
}
truncate($FH, tell($FH));
close($FH);

print $NUM $counter;
truncate($NUM, tell($NUM));
close($NUM);

print "Content-type:application/json; charset=UTF-8\n\n";
  print '{"status":"ok","text":"書き込み完了"}';

exit;

sub tagConvert{
  my $comm = shift;
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
  $comm =~ s#&lt;ruby&gt;(.+?)\((.*?)\)&lt;/ruby&gt;#<ruby>$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>#gi;
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
  
  # 自動リンク
  $comm =~ s#((?:\G|>)[^<]*?)(https?://[^\s\<]+)#$1<a href="$2" target="_blank">$2</a>#gi;
  
  $comm =~ s#&lt;br&gt;?#<br>#gi;
  
  return $comm;
}

sub memberEdit {
  my $type = shift;
  my $name = shift;
  my $user = shift;
  
  my %data;
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  if   ($type eq 'enter'){
    $data{'member'}{$user} = {};
    $data{'member'}{$user}{'name'} = $name;
    $data{'member'}{$user}{'date'} = time;
  }
  elsif($type eq 'exit') {
    delete $data{'member'}{$user};
  }
  # 最終アクセスが1日前のは消す
  foreach my $key (keys %{$data{'member'}}) {
    if(ref($data{'member'}{$key}) eq 'HASH' && time - $data{'member'}{$key}{'date'} < 60*60*24){ next; }
    delete $data{'member'}{$key};
  }
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
  
  if($::in{'system'} eq 'reload'){
    print "Content-type:application/json; charset=UTF-8\n\n";
    print decode('utf8', encode_json \%{$data{'member'}});
    exit;
  }
}

sub topicEdit {
  my $topic = shift;
  $topic =~ s/\r\n?|\n/<br>/g;
  
  my %data;
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  $data{'topic'} = $topic;
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}
sub memoEdit {
  my $num  = shift;
  my $memo = shift;
  $memo =~ s/<br>/\n/g;
  
  my %data;
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  if($num eq ''){ push(@{$data{'memo'}}, $memo); $num = $#{$data{'memo'}}; }
  else{ $data{'memo'}[$num] = $memo; }
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
  
  return $num;
}
sub bgEdit {
  my $url = shift;
  my $title = shift;
  
  my %data;
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  $data{'bg'}{'url'} = $url;
  $data{'bg'}{'title'} = $title;
  
  if($url){
    $data{'bg-history'}{$url} = $title;
  }
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}
sub bgmEdit {
  my $url = shift;
  my $title = shift;
  my $volume = shift;
  
  my %data;
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  if($url){
    $data{'bgm'}{'url'} = $url;
    $data{'bgm'}{'title'} = $title;
    $data{'bgm'}{'vol'} = $volume;
    
    $data{'bgm-history'}{$url} = [ $title,$volume ];
  }
  else {
    delete $data{'bgm'};
  }
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}

sub tabEdit {
  my $num = shift;
  my $name = shift;
  
  my %data;
  sysopen(my $FH, $dir.'tab.dat', O_RDWR) or error "tab.datが開けません";
  flock($FH, 2);
  s/(.*?)<>(.*)/$data{$1} = $2;''/eg while <$FH>;
  seek($FH, 0, 0);
  
  $data{$num} = $name;
  foreach (keys %data) {
    print $FH $_,'<>',$data{$_},"\n";
  }
  
  truncate($FH, tell($FH));
  close($FH);
}

sub checkReset {
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  foreach my $name (keys %{$data{'unit'}}) {
    delete $data{'unit'}{$name}{'check'};
  }
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}
sub roundChange {
  my $num = shift;
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  if($num eq 'reset'){
    $data{'round'} = 0;
  }
  else { $data{'round'} += $num; }
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
  
  checkReset;
  return $data{'round'};
}
sub unitMake {
  my $set_name = shift;
  my $set_data = shift;
  
  my %new;
  my $result;;
  if($set_data =~ /^http/){
    require './lib/pl/convert.pl';
    (my $new_data, $result) = dataConvert($set_data);
    %new = %{$new_data}
  }
  else {
    while ($set_data =~ s/(.+?) [:：] (?: "(.*?)" | (.*?) ) (?:\s|$)//xs){
      my $label  = $1;
      my $value = $2 || $3;
      if($label =~ /^(?:メモ|memo)$/){
        $new{'memo'} = $value;
      }
      elsif($label =~ /^(?:url)$/){
        $new{'url'} = $value;
      }
      else {
        $new{'status'}{$label} = $value;
        $result .= ($result ? '　' : '') . "<b>$label</b>:$value";
        push(@{$new{'sttnames'}}, $label);
      }
    }
    if($new{'url'}) { $result  = "<b>参照先</b>:<a href=\"$new{'url'}\" target=\"_blank\">$new{'url'}</a><br>".$result; }
    if($new{'memo'}){ $result .= ($result ? '　' : '') . "<b>メモ</b>:$new{'memo'}"; }
  }
  my $result_system;
  $result_system .= ($result_system ? ' | ' : '') . "$_>$new{'status'}{$_}" foreach (@{$new{'sttnames'}});
  if($new{'url'}) { $result_system .= " | url>$new{'url'}"; }
  if($new{'memo'}){ $result_system .= " | memo>$new{'memo'}"; }
  if($new{'palette'}){ push(@adds, {'system'=>'palette'}); }
  $result_system = 'unit:('.$result_system.')';
  
  $new{'color'} = $::in{'color'};
  
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
    flock($FH, 2);
    my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
    seek($FH, 0, 0);
    
    $data{'unit'}{$set_name} = \%new;
    
    print $FH decode('utf8', encode_json \%data);
    truncate($FH, tell($FH));
  close($FH);
  
  return ($result, $result_system);
}
sub unitDelete {
  my $set_name = shift;
  
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  delete $data{'unit'}{$set_name};
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}
sub unitCheck {
  my $set_name = shift;
  my $set_check = shift;
  
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  my $updateflag;
  if (exists $data{'unit'}{$set_name}) {
    $data{'unit'}{$set_name}{'check'} = $set_check;
    $updateflag = 1;
  }
  $data{'unit'}{$set_name}{'color'} = $::in{'color'} if $updateflag || $::in{'unitAdd'};
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}
sub unitCalcEdit {
  my $set_name = shift;
  my $set_text = shift;
  my $update = $set_text ? 0 : 1;
  
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  my $result_info; my $result_system; my $memo_flag;
  $set_text =~ tr/０-９＋－÷＊＝：！/0-9\+\-\/\*=:!/;
  while($set_text =~ s/^($stt_commands|メモ|memo)([+\-\/=\:])(?:"(.*?)"|(.*?))(?:\s|$)//s){
    my ($type, $op, $text, $num) = ($1,$2,$3,$4);
    # メモ
    if($type =~ /^(メモ|memo)$/){
      if($text eq '' && $num){ $text = $num; }
      if($op ne ":"){ $text = $op . $text; }
      my $result = tagConvert($text);
      $result =~ s/\n/<br>/g;
      $data{'unit'}{$set_name}{'memo'} = $result;
      $result_info .= "<b>メモ</b>:" . $result;
      $memo_flag = 1;
    }
    # 通常
    else {
      if($num eq '' && $text){ $num = $text; }
      if($op =~ /^[+\-\/=]$/){
        $num = parenthesisCalc($num);
        my ($result, $diff, $over) = sttCalc($type,$num,$op,$data{'unit'}{$set_name}{'status'}{$type});
        $data{'unit'}{$set_name}{'status'}{$type} = $result;
        $diff .= "(over${over})" if $over;
        $result_info .= ($result_info ? '　' : '') . "<b>$type</b>:$result";
        $result_info .= " [$diff]" if ($diff ne '');
      }
      elsif($op =~ /^:$/){
        my $result = $num;
        $data{'unit'}{$set_name}{'status'}{$type} = $result;
        $result_info .= ($result_info ? '　' : '') . "<b>$type</b>:$result";
      }
    }
  }
  if($result_info || $update){
    my %new;
    @status = do { my %c; grep {!$c{$_}++} @status }; # 重複削除
    foreach my $type (@status){
      $new{$type} = $data{'unit'}{$set_name}{'status'}{$type};
      $result_system .= ($result_system ? ' | ' : '')."$type>$new{$type}";
    }
    $result_system .= " | memo>$data{'unit'}{$set_name}{'memo'}" if $memo_flag;
    $result_system = 'unit:('.$result_system.')';
    $data{'unit'}{$set_name}{'status'} = \%new;
    $data{'unit'}{$set_name}{'sttnames'} = \@status;
  }
  $data{'unit'}{$set_name}{'color'} = $::in{'color'};
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
  
  return ($result_info, $result_system);
}
sub sttCalc {
  my $type = shift;
  my $num  = shift;
  my $op   = shift;
  my $base = shift;
  my $break;
  
  if($num =~ s/!$//){ $break = 1; }
  if($op ne '='){ $num =  $op.$num; }
  
  my @nums = split('/', $num, 2);
  my @base = split('/', $base, 2);
  my @diff;
  my @over;
  if($base[0] > $base[1]){ $break = 1; }
  foreach my $i (0 .. 1){
    next if $nums[$i] eq '';
    if($nums[$i] =~ /[+\-]/ && $op ne '='){
      $diff[$i] = calc($nums[$i]);
      $base[$i] = calc($base[$i]) + $diff[$i];
    }
    else {
      $diff[$i] = calc($nums[$i]) - $base[$i];
      $base[$i] = calc($nums[$i]);
    }
  }
  # 最大値頭打ち処理
  if(!$break && $base[1] ne '' && $base[0] > $base[1]){
    $over[0] = $base[0] - $base[1];
    if($over[0] > 0){
      $diff[0] -= $over[0];
    }
    $base[0] = $base[1];
  }
  foreach my $i (0..1){ $diff[$i] = ($diff[$i] >= 0 ? '+' : '') . $diff[$i] if ($diff[$i] ne ''); }
  
  return (join('/', @base), join('/', @diff)), $over[0];
}

sub parenthesisCalc {
  my $text = shift;
  while($text =~ s/\(([0-9\+\-\*\/]+?)\)/<calc>/i){
    my $calc = $1;
    if($calc eq ''){ return "" }
    if($calc !~ /[0-9]/i){ return "" }
    $calc = int(calc($calc));
    $text =~ s/<calc>/$calc/;
  }
  if($text =~ /\(.*?\)/){
    if($1 eq ''){ return "" }
    if($1 =~ /[^0-9]/){ return "" }
  }
  if($text =~ /\(|\)/){ return "" }
  return $text;
}

sub paletteUpdate {
  my $set_name = shift;
  my $set_text = shift;
  
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  $set_text =~ s/&lt;/</g;
  $set_text =~ s/&gt;/>/g;
  $data{'unit'}{$set_name}{'palette'} = $set_text;
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}

1;