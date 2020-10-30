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
my $id = $::in{'room'};
my $dir = "./room/${id}/";

foreach (%::in) {
  $::in{$_} = decode('utf8', $::in{$_});
  $::in{$_} =~ s/</&lt;/g;
  $::in{$_} =~ s/>/&gt;/g;
  $::in{$_} =~ s/\r\n?|\n/<br>/g;
  $::in{$_} =~ s/\\/&#92;/g;
}

my $info_message = roomEdit();

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
my $line = "$counter<>$date<>1<>!SYSTEM<><>ゲームルームの設定が変更されました<>$info_message<>change<>ゆとチャadv.<000><><>\n";

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

sub roomEdit {
  my $name = $::in{'config-room-name'} || '無題';
  my $game = ($::in{'config-room-game'} eq 'bcdice') ? $::in{'config-room-bcdice-game'} : $::in{'config-room-game'};
  my @tab = $::in{'config-room-tab'} ? split(/[ 　]/, $::in{'config-room-tab'}) : ();
  my @status = $::in{'config-room-status'} ? split(/[ 　]/, $::in{'config-room-status'}) : ();
  {
    my %data;
    sysopen(my $FH, $dir.'room.dat', O_RDWR) or error "room.datが開けません";
    flock($FH, 2);
    my %data = %{ decode_json(encode('utf8', (join '', <$FH>))) };
    seek($FH, 0, 0);
    
    my $i = 1;
    foreach (@tab){
      $data{'tab'}{$i} = "$_";
      $i++;
    }
    
    print $FH decode('utf8', encode_json \%data);
    truncate($FH, tell($FH));
    close($FH);
  }
  {
    my %data;
    sysopen(my $FH, './room/list.dat', O_RDWR | O_CREAT) or error "list.datが開けません";
    flock($FH, 2);
    my $text = join('', <$FH>);
    %data = %{ decode_json(encode('utf8', $text)) } if $text;
    seek($FH, 0, 0);
    ## パスワードチェック
    unless(
      #管理パスが一致すれば通す
      $set::password eq $::in{'config-room-password'}
      #ユーザー作成部屋なら
      || ($data{$id} && (
        #パスワード設定がなければ通す
            !$data{$id}{'pass'}
        #もしくはパスワード設定があり入力と一致すれば通す
        || ( $data{$id}{'pass'} && c_crypt($::in{'config-room-password'},$data{$id}{'pass'}) )
      ))
    ) {
      close($FH);
      error('パスワードが一致しません');
    }
    
    $data{$id}{'name'}   = $name;
    $data{$id}{'game'}   = $game;
    $data{$id}{'tab'}    = (@tab ? \@tab : undef);
    $data{$id}{'status'} = (@status ? \@status : undef);
    $data{$id}{'bcdice-url'} = $::in{'config-room-bcdice-url'};

    print $FH decode('utf8', encode_json \%data);
    truncate($FH, tell($FH));
    close($FH);
  }
  my $gamename = $set::games{$game}{'name'} ? $set::games{$game}{'name'} : $game ? $game : '－';
  return "<b>ゲームルーム名</b>: $name".'<br>'
        ."<b>ゲームシステム</b>: $gamename".'<br>'
        ."<b>チャットタブ</b>: ".(@tab    ? (join('　', @tab)    ): 'デフォルト').'<br>'
        ."<b>ステータス　</b>: ".(@status ? (join('　', @status) ): 'デフォルト').'<br>'
        .($::in{'config-room-bcdice-url'} ? "BCDice-API: $::in{'config-room-bcdice-url'}" : '').'<br>';
}


1;