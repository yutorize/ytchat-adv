use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Encode qw/encode decode/;
use Fcntl;
use JSON::PP;

###################
### 書き込み処理

my $log_pre_max = 50;
my $dir = "./room/$::in{'room'}/";

my @status = $set::rooms{$::in{'room'}}{'status'} ? @{$set::rooms{$::in{'room'}}{'status'}}
           : $set::games{$::in{'game'}}{'status'} ? @{$set::games{$::in{'game'}}{'status'}}
           : ('HP','MP','他');
my $stt_commands = join('|', @status);

if($::in{'room'} eq ''){ error "ルームIDがありません"; }
if($::in{'logKey'} eq ''){ error "ログKeyがありません"; }
if(!-d "room/".$::in{'room'}){ error "ルームがありません"; }
if(!$::in{'system'}){
  if($::in{'name'} eq ''){ error "名前がありません"; }
  if($::in{'comm'} eq ''){ error "発言がありません"; }
}

my $in_stt;
if($::in{'stt'}){
  $in_stt = decode_json( $::in{'stt'} );
}

foreach (%::in) {
  $::in{$_} = decode('utf8', $::in{$_});
  $::in{$_} =~ s/</&lt;/g;
  $::in{$_} =~ s/>/&gt;/g;
  $::in{$_} =~ s/\r\n?|\n/<br>/g;
  $::in{$_} =~ s/\\/&#92;/g;
}

# 入退室処理
if($::in{'system'} eq 'enter'){
  $::in{'name'} = "SYSTEM";
  $::in{'comm'} = "$::in{'player'}が入室しました。";
  if($::in{'unitAdd'}){ $::in{'system'} .= ' unit'; unitEdit($::in{'player'}); }
  delete $::in{'color'};
  memberEdit('enter', $::in{'player'}, $::in{'userId'});
}
elsif($::in{'system'} eq 'exit'){
  $::in{'name'} = "SYSTEM";
  $::in{'comm'} = "$::in{'player'}が退室しました。";
  delete $::in{'color'};
  #unitDelete($::in{'player'});
  memberEdit('exit', $::in{'player'}, $::in{'userId'});
}
else {
  # ラウンド処理
  if($::in{'comm'} =~ s<^/round([+\-][0-9])(?:\s|$)><>i){
    my $num = roundChange($1);
    $::in{'name'} = "SYSTEM by $::in{'player'}";
    $::in{'comm'} = "ラウンドを".($1 >= 0 ? '進め' : '戻し')."ました。（$1）";
    $::in{'info'} = "ラウンド: ${num}";
    $::in{'system'} = "round:".$num;
    delete $::in{'address'};
  }
  # ユニット処理
  #チェック
  elsif($::in{'comm'} =~ s/^[@＠](check|uncheck)(?:\s|$)//i){
    my %stts;
    $stts{'check'} = $1 eq 'check' ? 1 : 0;
    $::in{'info'} = 'チェック：'.($stts{'check'} ? '✔' : '×');
    $::in{'system'} = "check:".$stts{'check'};
    unitEdit($::in{'name'}, \%stts);
    delete $::in{'address'};
  }
  #レディチェック
  elsif($::in{'comm'} =~ s<^\/ready(?:\s|$)><>i){
    $::in{'name'} = "SYSTEM by $::in{'player'}";
    $::in{'comm'} = "レディチェックを開始しました。";
    $::in{'system'} = "ready";
    delete $::in{'color'};
    checkReset();
    delete $::in{'address'};
  }
  #削除
  elsif($::in{'comm'} =~ s/^(.*?)[@＠]delete$//i){
    my $name = $1 ? $1 : $::in{'name'};
    $::in{'name'} = "SYSTEM by $::in{'player'}";
    $::in{'comm'} = "ユニット「${name}」を削除しました。";
    $::in{'system'} = "unit-delete:${name}";
    delete $::in{'color'};
    unitDelete($name);
    delete $::in{'address'};
  }
  #変更
  elsif($::in{'comm'} =~ s/^[@＠](((?:$stt_commands)[\+＋\-－\/／=＝:：](?:.*?)(?:\s|$))+)//){
    my %stts;
    foreach (split(' ', $1)){
      $_ =~ tr/０-９＋－／＊＝：！/0-9\+\-\/\*=:!/;
      if($_ =~ /^($stt_commands)([+\-\/=])([0-9\+\-\/\*!]*)$/){
        my ($type, $op, $num) = ($1,$2,$3);
        my ($result, $diff, $over) = sttCalc($type,$num,$op);
        $diff .= "(over${over})" if $over;
        $::in{'info'} .= ($::in{'info'} ? ' ' : '') . "$type:$result";
        $::in{'info'} .= " [$diff]" if ($diff ne '');
        $::in{'system'} = "unit";
        $stts{$type} = $result;
      }
      elsif($_ =~ /^($stt_commands)[:](.*)$/){
        my ($type, $result) = ($1,$2);
        $::in{'info'} .= ($::in{'info'} ? ' ' : '') . "$type:$result";
        $::in{'system'} = "unit";
        $stts{$type} = $result;
      }
    }
    unitEdit($::in{'name'}, \%stts);
    delete $::in{'address'};
  }
  # トピック処理
  elsif($::in{'comm'} =~ s</topic(\s|$)><>i){
    topicEdit($::in{'comm'});
    $::in{'tab'} = '1';
    $::in{'system'} = 'topic';
    $::in{'name'} = "TOPIC by $::in{'player'}";
    $::in{'info'} = "$::in{'comm'}";
    $::in{'comm'} = $::in{'comm'} ? "" : "削除しました" ;
    delete $::in{'color'};
    delete $::in{'address'};
  }
  # メモ処理
  elsif($::in{'comm'} =~ s</memo([0-9]*)(\s|$)><>i){
    my $new = $1 eq '' ? 1 : 0;
    error('メモの内容がありません。') if ($new && !$::in{'comm'});
    my $num = memoEdit($1, $::in{'comm'});
    $::in{'tab'} = '1';
    $::in{'system'} = 'memo:'.$num;
    $::in{'name'} = "SYSTEM by $::in{'player'}";
    $::in{'info'} = "$::in{'comm'}";
    $::in{'comm'} = "共有メモ".($num+1)."を". ($new ? '追加' : ($::in{'comm'} ? '更新' : "削除")) ."しました";
    delete $::in{'address'};
  }
  # BCDice処理
  elsif($::in{'bcdice'}){
    $::in{'comm'} =~ s/^(.*?(?:\s|<br>|$))//;
    $::in{'info'} = $::in{'bcdice'}.'<<'.$1;
    $::in{'system'} = 'dice';
  }
  # ダイス処理
  elsif($::in{'comm'} =~ /^(?:[\@＠\$＄]|[a-zａ-ｚA-ZＡ-Ｚ0-9０-９\+＋\-－\*＊\/／\^＾\@＠\$＄#＃()（）]{2,})/i){
    require './lib/pl/dice.pl';
    ($::in{'info'}, $::in{'system'}) = diceCheck($::in{'comm'});
    if($::in{'info'}){
      $::in{'comm'} =~ s/^(.*?(?:\s|<br>|$))//;
      $::in{'info'} .= '<<'.$1;
    }
  }
  # ダイス末尾マッチ
  #elsif($::in{'comm'} =~ /(?:\s|<br>)((?:[\@＠\$＄]|[a-zａ-ｚA-ZＡ-Ｚ0-9０-９\+＋\-－\*＊\/／\^＾\@＠\$＄#＃()（）]{2,}).*)$/i){
  #  require './lib/pl/dice.pl';
  #  ($::in{'info'}, $::in{'system'}) = diceCheck($1);
  #  if($::in{'info'}){
  #    $::in{'comm'} =~ s/((?:\s|<br>).*?)$//;
  #    $::in{'info'} .= '<<'.$1;
  #  }
  #}
}
error('書き込む情報がありません') if ($::in{'comm'} eq '' && $::in{'info'} eq '');

# 秘話
if($::in{'address'}){
  $::in{'name'} .= ' > '.$::in{'addressName'};
  $::in{'address'} .= $::in{'openlater'} ? '#' : '';
}

# タグ変換
$::in{'comm'} = tagConvert($::in{'comm'});

# 最終安全装置
$::in{'comm'} =~ s/<>/&lt;&gt;/g; $::in{'comm'} =~ s/\r\n?|\n/ /g;
$::in{'info'} =~ s/<>/&lt;&gt;/g; $::in{'info'} =~ s/\r\n?|\n/ /g;

# 時間取得
my @time = localtime(time);
my $date = sprintf("%04d/%02d/%02d %02d:%02d:%02d", $time[5]+1900,$time[4]+1,$time[3],$time[2],$time[1],$time[0]);


# カウンター
sysopen(my $NUM, $dir."log-num-$::in{'logKey'}.dat", O_RDWR) or error "log-num-$::in{'logKey'}.datが開けません";
flock($NUM, 2);
my $counter = <$NUM>;
seek($NUM, 0, 0);

$counter++;

## 新規データ
my $line = "$counter<>$date<>$::in{'tab'}<>$::in{'name'}<>$::in{'color'}<>$::in{'comm'}<>$::in{'info'}<>$::in{'system'}<>$::in{'player'}<$::in{'userId'}><>$::in{'address'}<>\n";

# 過去ログに追加
sysopen(my $LOG, $dir.'log-all.dat', O_WRONLY | O_APPEND) or error "log-all.datが開けません";
print $LOG $line;
close($LOG);


# 現在ログに追加
sysopen(my $FH, $dir.'log-pre.dat', O_RDWR) or error "log-pre.datが開けません";
flock($FH, 2);
my @lines = <$FH>;
seek($FH, 0, 0);
unshift (@lines, $line);
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
  
  $comm =~ s#&lt;hr&gt;(<br>)?#<hr>#gi;
  $comm =~ s#&lt;ruby&gt;(.+?)&lt;rt&gt;(.*?)&lt;/rt&gt;&lt;/ruby&gt;#<ruby>$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>#gi;
  1 while $comm =~ s#&lt;hide&gt;(.+?)&lt;/hide&gt;#<span class="hide">$1</span>#gi;
  1 while $comm =~ s#&lt;em&gt;(.+?)&lt;/em&gt;#<em>$1</em>#gi;
  1 while $comm =~ s#&lt;b&gt;(.*?)&lt;/b&gt;#<b>$1</b>#gi;
  1 while $comm =~ s#&lt;i&gt;(.*?)&lt;/i&gt;#<i>$1</i>#gi;
  1 while $comm =~ s#&lt;s&gt;(.*?)&lt;/s&gt;#<s>$1</s>#gi;
  1 while $comm =~ s#&lt;u&gt;(.*?)&lt;/u&gt;#<u>$1</u>#gi;
  1 while $comm =~ s#&lt;c:([0-9a-zA-Z\#]*?)&gt;(.*?)&lt;/c&gt;#<span style="color:$1">$2</span>#gi;
  1 while $comm =~ s#&lt;big&gt;(.*?)&lt;/big&gt;#<span class="large">$1</span>#gi;
  1 while $comm =~ s#&lt;small&gt;(.*?)&lt;/small&gt;#<span class="small">$1</span>#gi;
  
  1 while $comm =~ s#&lt;left&gt;(.*?)&lt;/left&gt;(?:<br>)?#<div class="left">$1</div>#gi;
  1 while $comm =~ s#&lt;center&gt;(.*?)&lt;/center&gt;(?:<br>)?#<div class="center">$1</div>#gi;
  1 while $comm =~ s#&lt;right&gt;(.*?)&lt;/right&gt;(?:<br>)?#<div class="right">$1</div>#gi;
  
  # 自動リンク
  $comm =~ s#(https?://[^\s\<]+)#<a href="$1" target="_blank">$1</a>#gi;
  
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
  
  if   ($type eq 'enter'){ $data{'member'}{$user} = $name; }
  elsif($type eq 'exit') { delete $data{'member'}{$user}; }
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}
sub topicEdit {
  my $topic = shift;
  
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
    delete $data{'unit'}{$name}{'status'}{'check'};
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
  
  $data{'round'} += $num;
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
  
  checkReset;
  return $data{'round'};
}
sub unitEdit {
  my $set_name = shift;
  my $set_data = shift;
  
  sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  $data{'unit'}{$set_name}{'color'} = $::in{'color'};
  foreach (keys %$set_data) {
    $data{'unit'}{$set_name}{'status'}{$_} = $$set_data{$_};
  }
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
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
sub sttCalc {
  my $type = shift;
  my $num  = shift;
  my $op   = shift;
  my $break;
  
  if($num =~ s/!$//){ $break = 1; }
  if($op ne '='){ $num =  $op.$num; }
  
  my @nums = split('/', $num, 2);
  my @base = split('/', $in_stt->{$type}, 2);
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

1;