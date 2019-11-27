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
### 読み込み処理

$ROOM->param(roomId => $id);
$ROOM->param(title => $rooms{$id}{'name'});
my @list;
foreach my $id (sort keys %rooms){
  next if !$id;
  next if $rooms{$id}{'secret'};
  my $game = $games{$rooms{$id}{'game'}} ? $games{$rooms{$id}{'game'}}{'name'}
           : $rooms{$id}{'game'} ? $rooms{$id}{'game'}
           : 'その他';
  push(@list, {
    "ID"     => $id,
    "NAME"   => $rooms{$id}{'name'},
    "GAME"   => $game,
  })
}

$ROOM->param(List => \@list);


$ROOM->param(ver => $::ver);

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