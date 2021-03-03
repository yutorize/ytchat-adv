use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use HTML::Template;
use Encode qw/encode decode/;
use JSON::PP;
use URI::Escape;

my $id = $::in{'id'}; #部屋ID

my %games = %set::games;
my %rooms;
if(sysopen(my $FH, './room/list.dat', O_RDONLY)){
  my $text = join('', <$FH>);
  %rooms = %{ decode_json(encode('utf8', $text)) } if $text;
  close($FH);
}
foreach my $key (keys %set::rooms){
  $rooms{$key} = $set::rooms{$key};
}
my %roomdata;

###################
### 部屋の有無をチェック
error('ルームがありません') if !exists($rooms{$id});

my %room = %{$rooms{$id}};
my @tabs = $room{'tab'} ? @{$room{'tab'}} : ('メイン','サブ');

###################
### ディレクトリ・ファイルが無い場合
my $key = random_key(4);
if (!-d "./room/${id}"){
  mkdir "./room/${id}";
}
if (!-f "./room/${id}/room.dat"){
  sysopen (my $FH, "./room/${id}/room.dat", O_WRONLY | O_TRUNC | O_CREAT, 0666);
    print $FH '{"tab":{';
    my $i = 0;
    foreach my $tab (@tabs){
      print $FH ',' if $i;
      $i++;
      print $FH '"'.$i.'":"'.$tab.'"';
    }
    print $FH '}}';
  close($FH);
  
  sysopen (my $FH, "./room/${id}/log-num-${key}.dat", O_WRONLY | O_TRUNC | O_CREAT, 0666);
    print $FH '0';
  close($FH);
  sysopen (my $FH, "./room/${id}/log-key.dat", O_WRONLY | O_TRUNC | O_CREAT, 0666);
    print $FH $key;
  close($FH);
}
else {
  my $dir = "./room/$::in{'id'}/";
  sysopen(my $FH, $dir.'room.dat', O_RDONLY) or error "room.datが開けません";
  %roomdata = %{ decode_json(encode('utf8', (join '', <$FH>))) };
  close($FH);
}

if (!-f "./room/${id}/log-all.dat"){
  my @time = localtime(time);
  my $date = sprintf("%04d/%02d/%02d %02d:%02d:%02d", $time[5]+1900,$time[4]+1,$time[3],$time[2],$time[1],$time[0]);
  
  sysopen (my $FH, "./room/${id}/log-all.dat", O_WRONLY | O_TRUNC | O_CREAT, 0666);
    if($roomdata{'bg'}){ print $FH "0<>$date<>1<>!SYSTEM<><>背景が引き継がれました<>$roomdata{'bg'}{'title'}<>bg:$roomdata{'bg'}{'url'}<>ゆとチャadv.<000><><>\n"; }
    if($roomdata{'topic'}){ print $FH "0<>$date<>1<>!SYSTEM<><>トピックが引き継がれました<>$roomdata{'topic'}<>topic<>ゆとチャadv.<000><><>\n"; }
  close($FH);
}

if (!-f "./room/${id}/log-pre.dat"){
  sysopen (my $FH, "./room/${id}/log-pre.dat", O_WRONLY | O_TRUNC | O_CREAT, 0666);
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
### 出力内容代入

$ROOM->param(ver => $::ver);

$ROOM->param(roomId => $id);
$ROOM->param(title => $room{'name'});

my $game = $room{'game'};
$ROOM->param(gameSystem => $game);
$ROOM->param(gameSystemName => $games{$game}{'name'} ? $games{$game}{'name'} : $game ? $game : '－');

$ROOM->param(bcdiceAPI => $room{'bcdice-url'} || ($room{'bcdice'} ? $set::bcdice_api : ''));
$ROOM->param(bcdiceSystem => $games{$game}{'bcdice'} ? $games{$game}{'bcdice'} : $game ? $game : 'DiceBot');

my @status = $room{'status'} ? @{$room{'status'}}
           : $games{$game}{'status'} ? @{$games{$game}{'status'}}
           : ('HP','MP','他');
$ROOM->param(sttNameList => join("','", @status));
$ROOM->param(SttNameListValue => join("　", @status));
$ROOM->param(tabArray => join("','", @tabs));
$ROOM->param(tabArrayValue => join("　", @tabs));

$ROOM->param(newUnitSttDefault => join(":\n",@status).':');

if   ($game eq 'sw2') { $ROOM->param(helpOnSW2 => 1); }
elsif($game eq 'dx3') { $ROOM->param(helpOnDX3 => 1); }
if($room{'bcdice-url'} || $room{'bcdice'}) { $ROOM->param(helpOnBCDice => 1); }

my @text_replace;
foreach (@set::replace_help){
  push(@text_replace, {
    'BEFORE' => @{$_}[0],
    'AFTER'  => @{$_}[1],
    'HELP'   => @{$_}[2],
  });
}
$ROOM->param(TextReplace => \@text_replace);

my @chat_se_list;
my @ready_se_list;
push(@chat_se_list,  { 'URL' => @{$_}[0], 'NAME' => @{$_}[1], }) foreach (@set::chat_se_list );
push(@ready_se_list, { 'URL' => @{$_}[0], 'NAME' => @{$_}[1], }) foreach (@set::ready_se_list);
$ROOM->param(chatSEList  => \@chat_se_list);
$ROOM->param(readySEList => \@ready_se_list);

my @random_table;
foreach my $key (sort keys %set::random_table){
  next if !$set::random_table{$key}{'help'};
  next if ($set::random_table{$key}{'game'} && $set::random_table{$key}{'game'} ne $game);
  push(@random_table, {
    'COMMAND'  => $key,
    'HELP' => $set::random_table{$key}{'help'},
  });
}
$ROOM->param(RandomTable => \@random_table);

my @bg_list;
foreach (@set::bg_preset){
  next if !$_ || !@$_[0];
  push(@bg_list, { 'URL' => @$_[0], 'TITLE' => @$_[1] });
}
$ROOM->param(bgPreset => \@bg_list);

my @encoded_bgm_preset = encode_json \@set::bgm_preset;
$ROOM->param(bgmPreset => decode('utf8', uri_escape(@encoded_bgm_preset)));

my @src_url;
if($set::src_url_limit){
  foreach (@set::src_url_list){
    next if !$_;
    push(@src_url, { 'URL' => $_ });
  }
}
$ROOM->param(srcURL => \@src_url);

$ROOM->param(customCSS => $set::custom_css);

$ROOM->param(userRoomFlag => exists($set::rooms{$id}) ? 0 : 1);

###################
### 出力
print "Content-Type: text/html\n\n";
print $ROOM->output;

exit;

sub random_key {
  my @char = (0..9,'a'..'z','A'..'Z');
  my $s;
  1 while (length($s .= $char[rand(@char)]) < $_[0]);
  return $s;
}

1;