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
my $dir = "room/$::in{'room'}/";
my $stt_commands = join('|', @{$set::games{'sw2'}{'status'}});

if($::in{'room'} eq ''){ error "ルームIDがありません"; }
if(!-d "room/".$::in{'room'}){ error "ルームがありません"; }
if(!$::in{'system'}){
  if($::in{'name'} eq ''){ error "名前がありません"; }
  if($::in{'comm'} eq ''){ error "発言がありません"; }
}

my %in_stt;
if($::in{'stt'}){
  my $text = decode('utf8', $::in{'stt'});
  foreach my $data ( split('<>', $text) ){
    my ($name, $value) = split('=', $data);
    $in_stt{$name} = $value;
  }
}

foreach (%::in) {
  $::in{$_} = decode('utf8', $::in{$_});
  $::in{$_} =~ s/</&lt;/g;
  $::in{$_} =~ s/>/&gt;/g;
  $::in{$_} =~ s/\r\n?|\n/<br>/g;
  $::in{$_} =~ s/\\/&#92;/g;
  
  if($_ eq 'comm'){
    $::in{$_} =~ s/[|｜](.+?)《(.*?)》/<ruby>$1<rp>(<\/rp><rt>$2<\/rt><rp>)<\/rp><\/ruby>/gi;
    $::in{$_} =~ s/《《(.+?)》》/<em>$1<\/em>/gi;
    1 while $::in{$_} =~ s/&lt;b&gt;(.*?)&lt;\/b&gt;/<b>$1<\/b>/gi;
    1 while $::in{$_} =~ s/&lt;i&gt;(.*?)&lt;\/i&gt;/<i>$1<\/i>/gi;
    1 while $::in{$_} =~ s/&lt;s&gt;(.*?)&lt;\/s&gt;/<s>$1<\/s>/gi;
    1 while $::in{$_} =~ s/&lt;c:([0-9a-zA-Z#]*?)&gt;(.*?)&lt;\/c&gt;/<span style="color:$1">$2<\/span>/gi;
    1 while $::in{$_} =~ s/&lt;big&gt;(.*?)&lt;\/big&gt;/<span class="large">$1<\/span>/gi;
    1 while $::in{$_} =~ s/&lt;small&gt;(.*?)&lt;\/small&gt;/<span class="small">$1<\/span>/gi;
  }
}
$::in{'comm-raw'} = $::in{'comm'};

# 入退室処理
if($::in{'system'} eq 'enter'){
  $::in{'name'} = "SYSTEM";
  $::in{'comm'} = "$::in{'player'}が入室しました。";
  unitEdit($::in{'player'});
}
elsif($::in{'system'} eq 'exit'){
  $::in{'name'} = "SYSTEM";
  $::in{'comm'} = "$::in{'player'}が退室しました。";
}
# ダイス処理
if($::in{'comm'} =~ /^[a-zａ-ｚA-ZＡ-Ｚ0-9０-９\+＋\-ー\@＠\$＄#＃()（）]{2,}/i){
  require 'lib/pl/dice.pl';
  $::in{'dice'} = diceCheck($::in{'comm'});
  if($::in{'dice'}){ $::in{'comm'} =~ s/^.*?(?:\s|$)//; }
}
# ユニット処理
#チェック
if($::in{'comm'} =~ s/^[@＠](check|cancel)(?: |　|$)//i){
  my %data;
  $data{'check'} = $1 eq 'check' ? 1 : 0;
  $::in{'dice'} = 'チェック：'.($data{'check'} ? '✔' : '×');
  $::in{'system'} = "check:".$data{'check'};
  unitEdit($::in{'name'}, \%data);
}
#レディチェック
elsif($::in{'comm'} =~ s/^\/ready(?: |　|$)//i){
  $::in{'name'} = "SYSTEM by $::in{'player'}";
  $::in{'comm'} = "レディチェックを開始しました。";
  $::in{'system'} = "ready";
  checkReset();
}
#削除
elsif($::in{'comm'} =~ s/^(.*?)[@＠]delete$//i){
  my $name = $1 ? $1 : $::in{'name'};
  $::in{'name'} = "SYSTEM by $::in{'player'}";
  $::in{'comm'} = "ユニット「${name}」を削除しました。";
  $::in{'system'} = "unit-delete:${name}";
  delete $::in{'color'};
  unitDelete($name);
}
#変更
elsif($::in{'comm'} =~ s/^[@＠](((?:$stt_commands)[\+＋\-－\/／=＝:：](?:.*?)(?: |　|$))+)//){
  my %stts;
  foreach (split(' ', $1)){
    $_ =~ tr/０-９＋－／＊＝：/0-9\+\-\/\*=:/;
    if($_ =~ /^($stt_commands)([+\-\/=])([0-9\+\-\/\*]*)$/){
      my ($type, $op, $num) = ($1,$2,$3);
      my ($result, $diff) = sttCalc($type,$num,$op);
      $::in{'dice'} .= ($::in{'dice'} ? ' ' : '') . "$type:$result";
      $::in{'dice'} .= " [$diff]" if ($diff ne '');
      $::in{'system'} = "unit";
      $stts{$type} = $result;
    }
    elsif($_ =~ /^($stt_commands)[=:](.*)$/){
      my ($type, $result) = ($1,$2);
      $::in{'dice'} .= ($::in{'dice'} ? ' ' : '') . "$type:$result";
      $::in{'system'} = "unit";
      $stts{$type} = $result;
    }
  }
  unitEdit($::in{'name'}, \%stts);
}
# トピック処理
if($::in{'comm'} =~ s%/topic(\s|$)%%i){
  topicEdit($::in{'comm'});
  $::in{'tab'} = '1';
  $::in{'system'} = 'topic';
  $::in{'name'} = "TOPIC by $::in{'player'}";
  $::in{'dice'} = "$::in{'comm'}";
  $::in{'comm'} = $::in{'comm'} ? "" : "削除しました" ;
  delete $::in{'color'};
}

my @time = localtime(time);
my $date = sprintf("%04d/%02d/%02d %02d:%02d:%02d", $time[5]+1900,$time[4]+1,$time[3],$time[2],$time[1],$time[0]);

# 最終チェック
error('書き込む情報がありません') if ($::in{'comm'} eq '' && $::in{'dice'} eq '');

# カウンター
sysopen(my $NUM, $dir.'log-num.dat', O_RDWR | O_CREAT, 0666) or error "log-num.datが開けません";
flock($NUM, 2);
my $counter = <$NUM>;
seek($NUM, 0, 0);

$counter++;

## 新規データ
my $line = "$counter<>$date<>$::in{'tab'}<>$::in{'name'}<>$::in{'color'}<>$::in{'comm'}<>$::in{'dice'}<>$::in{'system'}<>$::in{'player'}<$::in{'userId'}><>\n";

# 過去ログに追加
sysopen(my $LOG, $dir.'log-all.dat', O_WRONLY | O_APPEND | O_CREAT, 0666) or error "log-all.datが開けません";
print $LOG $line;
close($LOG);

# 現在ログに追加
sysopen(my $FH, $dir.'log-pre.dat', O_RDWR | O_CREAT, 0666) or error "log-pre.datが開けません";
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

sub topicEdit {
  my $topic = shift;
  
  my %data;
  sysopen(my $FH, $dir.'room.dat', O_RDWR | O_CREAT) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  $data{'topic'} = $topic;
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}

sub tabEdit {
  my $num = shift;
  my $name = shift;
  
  my %data;
  sysopen(my $FH, $dir.'tab.dat', O_RDWR | O_CREAT) or error "tab.datが開けません";
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
  sysopen(my $FH, $dir.'room.dat', O_RDWR | O_CREAT) or error "room.datが開けません";
  flock($FH, 2);
  my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  seek($FH, 0, 0);
  
  foreach my $name (keys %{$data{'unit'}}) {
    $data{'unit'}{$name}{'check'} = '';
  }
  
  print $FH decode('utf8', encode_json \%data);
  truncate($FH, tell($FH));
  close($FH);
}
sub unitEdit {
  my $set_name = shift;
  my $set_data = shift;
  
  sysopen(my $FH, $dir.'room.dat', O_RDWR | O_CREAT) or error "room.datが開けません";
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
  
  sysopen(my $FH, $dir.'room.dat', O_RDWR | O_CREAT) or error "room.datが開けません";
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
  
  if($op ne '='){ $num =  $op.$num; }
  
  my @nums = split('/', $num, 2);
  my @base = split('/', $in_stt{$type}, 2);
  my @diff;
  foreach my $i (0 .. $#nums){
    next if $nums[$i] eq '';
    if($nums[$i] =~ /[+\-]/ && $op ne '='){
      $diff[$i] = calc($nums[$i]);
      $base[$i] = calc($base[$i]) + $diff[$i];
    }
    else {
      $diff[$i] = $nums[$i] - $base[$i];
      $base[$i] = $nums[$i];
    }
    $diff[$i] = ($diff[$i] >= 0 ? '+' : '') . $diff[$i] if ($diff[$i] ne '');
  }
  
  return (join('/', @base), join('/', @diff));
}

1;