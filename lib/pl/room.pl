use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use HTML::Template;

my $id = $::in{'id'}; #部屋ID

my %rooms = %set::rooms;
my %games = %set::games;

###################
### 部屋の有無をチェック
error('ルームがありません') if !exists($rooms{$id});

###################
### ディレクトリが無い場合
if (!-d "./room/${id}"){
  mkdir "./room/${id}";
  sysopen (my $FH, "./room/${id}/log-num.dat", O_WRONLY | O_TRUNC | O_CREAT, 0666);
    print $FH '0';
  close($FH);
  sysopen (my $FH, "./room/${id}/room.dat", O_WRONLY | O_TRUNC | O_CREAT, 0666);
    print $FH '{"tab":{';
    my $i = 0;
    foreach my $tab (split(',', $rooms{$id}{'tab'})){
      print $FH ',' if $i;
      $i++;
      print $FH '"'.$i.'":"'.$tab.'"';
    }
    print $FH '}}';
  close($FH);
}

###################
### テンプレート読み込み
my $ROOM;
$ROOM = HTML::Template->new(
  filename => './lib/html/room.html',
  utf8 => 1,
  loop_context_vars => 1,
  die_on_bad_params => 0,
  die_on_missing_include => 0,
  case_sensitive => 1,
  global_vars => 1
);

###################
### 読み込み処理

$ROOM->param(roomId => $id);
$ROOM->param(title => $rooms{$id}{'name'});

my $game = $rooms{$id}{'game'};
$ROOM->param(gameSystem => $games{$game}{'name'});

my @status = @{ $games{$game}{'status'} };
$ROOM->param(SttNameList => join("','", @status));

$ROOM->param(newUnitSttDefault => join(': ',@status).':');


###################
### 出力
print "Content-Type: text/html\n\n";
print $ROOM->output;

exit;

1;