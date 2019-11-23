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
error('データがありません') if !exists($rooms{$id}) && !$::in{'date'};

my @tabs = @{$rooms{$id}{'tab'}};

###################
### テンプレート読み込み
my $ROOM;
$ROOM = HTML::Template->new(
  filename => './lib/html/logs.html',
  utf8 => 1,
  loop_context_vars => 1,
  die_on_bad_params => 0,
  die_on_missing_include => 0,
  case_sensitive => 1,
  global_vars => 1
);

###################
### ログ本体

$ROOM->param(roomId => $id);
$ROOM->param(title => $rooms{$id}{'name'});
$ROOM->param(subtitle => $::in{'date'});

my $logfile = $::in{"date"} ? "./logs/".$::in{"date"}.".dat" : "./room/${id}/log-all.dat";
sysopen (my $FH, $logfile, O_RDONLY);
my @logs;
my $before_tab;
my $before_name;
my $before_color;
my $before_user;
foreach (<$FH>){
  if($_ =~ s/^>//) {
    my ($name, $tab) = split(/<>/, $_);
    $ROOM->param(title => $name);
    @tabs = split(',', $tab);
    next;
  }
  
  my ($num, $date, $tab, $name, $color, $comm, $info, $system, $user) = split(/<>/, $_);
  $user =~ s/<.+?>$//;
  
  my $type = ($system =~ /^(check|round|dice)/) ? 'dice' : $system;
     $type =~ s/:.*?$//;
  my $game = ($system =~ /^dice:(.*)$/) ? $1 : '';
  my $code;
  my @infos = split(/<br>/,$info);
  foreach (@infos){
    { $_ =~ s/\<\<(.*)$//; $code = $1; }
    if($system =~ /^dice/){
      $_ =~ s#(\[.*?\#])#<i>$1</i>#g;
      $_ =~ s# = ([0-9a-z.∞]+)$# = <strong>$1</strong>#gi;
      $_ =~ s# = ([0-9a-z.]+)# = <b>$1</b>#gi;
      #クリティカルをグラデにする
      my $crit = $_ =~ s/(クリティカル!\])/$1<em>/g;
      while($crit > 0){ $_ .= "</em>"; $crit--; }
      #ファンブル用の色適用
      if($_ =~ /1ゾロ|ファンブル/){ $_ = "<em class='fail'>$_</em>"; }
      #
      $_ =~ s#\{(.*?)\}#{<span class='division'>$1</span>}#g;
    }
    if($system =~ /^unit/){
      $_ =~ s# (\[.*?\])# <i>$1</i>#g;
    }
  }
  $info = join('<br>', @infos);
  if(!$tabs[$tab-1]){ $tabs[$tab-1] = "タブ${tab}"; }
  
  if ( $before_tab   ne $tab
    || $before_name  ne $name
    || $before_color ne $color
    || $before_user  ne $user
  ){
    push(@logs, {
      "NUM"    => $num,
      "DATE"   => $date,
      "TAB"    => $tab,
      "TABNAME"=> $tabs[$tab-1],
      "USER"   => $user,
      "NAME"   => $name,
      "COLOR"  => $color,
      "LogsDD" => [],
    });
  }
  
  push(@{$logs[$#logs]{'LogsDD'}},{
    "COMM"  => $comm,
    "TYPE"  => $type,
    "INFO"  => $info,
    "GAME"  => $game,
  });
  
  $before_tab   = $tab;
  $before_name  = $name;
  $before_color = $color;
  $before_user  = $user;
}
close($FH);
$ROOM->param(Logs => \@logs);

###################
### タブ一覧
my @tablist;
foreach my $num (0 .. $#tabs){
  push(@tablist, {'NUM' => $num+1, 'NAME' => $tabs[$num]});
}
$ROOM->param(TabList => \@tablist);

###################
### 部屋一覧
my @roomlist;
foreach my $id (sort keys %rooms){
  next if ($rooms{$id}{'secret'});
  push(@roomlist, {'ID' => $id, 'NAME' => $rooms{$id}{'name'}});
}
$ROOM->param(RoomList => \@roomlist);

###################
### 過去ログ一覧
opendir(my $DIR,"./logs/");
my @loglist;
foreach my $name (readdir($DIR)){
  next if ($name eq '.');
  $name =~ s/\..+?$//;
  push(@loglist, {'NAME' => $name});
}
closedir($DIR);
$ROOM->param(LogList => \@loglist);

###################
### 出力
print "Content-Type: text/html\n\n";
print $ROOM->output;

exit;

1;