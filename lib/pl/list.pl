use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use HTML::Template;
use Encode qw/encode decode/;
use JSON::PP;

my %games = %set::games;
my %rooms = getRoomList();
my $userroom_num = keys %rooms;
   $userroom_num -= keys %set::rooms;

###################
### テンプレート読み込み
my $ROOM;
$ROOM = HTML::Template->new(
  filename => './lib/html/list.html',
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

my @list; my @addlist;
foreach my $id (sort keys %rooms){
  next if !$id;
  next if $rooms{$id}{'secret'};
  my $game = $games{$rooms{$id}{'game'}} ? $games{$rooms{$id}{'game'}}{'name'}
           : $rooms{$id}{'game'} ? $rooms{$id}{'game'}
           : 'その他';
  my $size = sprintf("%.1f", (-s "./room/$id/log-all.dat") / 1024);
  $size =~ s|\.([0-9]+)|.<small>$1</small>|;
  if($set::rooms{$id}){
    push(@list, {
      "ID"     => $id,
      "NAME"   => $rooms{$id}{'name'},
      "GAME"   => $game,
      "SIZE"   => $size.' kb',
    });
  }
  else {
    push(@addlist, {
      "ID"     => $id,
      "NAME"   => $rooms{$id}{'name'},
      "GAME"   => $game,
      "SIZE"   => $size.' kb',
    });
  }
}
@addlist = sort { $a->{'NAME'} cmp $b->{'NAME'}; } @addlist;
push @list, @addlist;

$ROOM->param(List => \@list);

$ROOM->param(gamesList => decode('utf8', encode_json \%games));
$ROOM->param(defaultGame => $set::default_game||'');


my $userroom_on = $set::userroom_on;
if($userroom_on && $set::userroom_max && $userroom_num >= $set::userroom_max){ $userroom_on = 0; }
$ROOM->param(userRoomOn => $userroom_on);
$ROOM->param(userRoomFormOpen => $::in{'form'} ? 'open' : '');

$ROOM->param(home => $set::home_url);

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