use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use Fcntl;
use HTML::Template;
use CGI::Cookie;

###################
### ログ成形

sub logOutput {
my %opt = (
  "type" =>"now",
  @_,
);

my %cookies = fetch CGI::Cookie;
my $cookie_id = $cookies{'ytchat-userid'}->value if(exists $cookies{'ytchat-userid'});

my $id = $::in{'id'}; #部屋ID

my %rooms = %set::rooms;
my %games = %set::games;

my $logs_dir = ($id && $rooms{$id}{'logs-dir'}) ? $rooms{$id}{'logs-dir'} : $set::logs_dir;

###################
### 部屋の有無をチェック
error('データがありません') if !exists($rooms{$id}) && !$::in{'log'};

my @tabs = $id ? ($rooms{$id}{'tab'} ? @{$rooms{$id}{'tab'}} : ('メイン','サブ')) : ();

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
$ROOM->param(subtitle => $::in{'log'}?$::in{'log'}:'現行ログ');

my $logfile = ($opt{'old'}) ? "${logs_dir}/$::in{'log'}.dat" : "./room/${id}/log-all.dat";
sysopen (my $FH, $logfile, O_RDONLY);
my @logs;
my $before_tab;
my $before_name;
my $before_color;
my $before_user;
foreach (<$FH>){
  chomp;
  if($_ =~ s/^>//) {
    my ($name, $tab) = split(/<>/, $_);
    $ROOM->param(title => $name);
    @tabs = split(',', $tab);
    next;
  }
  
  my ($num, $date, $tab, $name, $color, $comm, $info, $system, $user, $address) = split(/<>/, $_);
  my $userid;
  $user =~ s/<(.+?)>$/$userid = $1; '';/e;
  
  my $openlater;
  if($address){
    if($address =~ s/\#$//){ $openlater = 1; } #青秘話=1
    # 過去ログ
    if($opt{'old'}){
      #赤秘話なら非表示（青は通す）
      if(!$openlater){ next; }
    }
    # 現行ログ
    else {
      #自発信でも自受信でもなければ非表示（赤青は問わない）
      if($cookie_id ne $userid && $cookie_id ne $address){ next; }
    }
  }
  
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
      $_ =~ s#\[([0-9,]+?)!!]#<em>[$1]</em>#g;
      #ファンブル用の色適用
      if($_ =~ /1ゾロ|ファンブル/){ $_ = "<em class='fail'>$_</em>"; }
      $_ =~ s#\[([0-9,]+?)\.\.\.\]#<em class='fail'>[$1]</em>#g;
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
      "SECRET" => $address ? 'secret' : '',
      "OPENlATER" => $openlater ? 'openlater' : '',
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
if($opt{'roomList'}){
  my @roomlist;
  foreach my $i (sort keys %rooms){
    next if ($rooms{$i}{'secret'} && $id ne $i);
    push(@roomlist, {'ID' => $i, 'NAME' => $rooms{$i}{'name'}});
  }
  $ROOM->param(RoomList => \@roomlist);
}
###################
### 過去ログ一覧
use File::Find;
if($opt{'logList'}){
  my $dir = $logs_dir;
     $dir =~ s|/$||;
  my @loglist;
  find sub {
      my $file = $_;
      my $name = $file;
         $name =~ s/\..+?$//;
      my $subdir = $File::Find::dir;
         $subdir =~ s|^$dir/?||;
      my $path = $File::Find::name;
         $path =~ s|^$dir/?(.+?)\.dat$|$1|;
      my $current = ($name eq $::in{'log'}) ? 1 : 0;
      if(-d $file){
        if($name ne '.'){
          push(@loglist, {'NAME' => $name, 'SUB' => $subdir, 'DIR' => 1});
        }
      }
      if(-f $file){
        push(@loglist, {'NAME' => $name, 'SUB' => $subdir, 'PATH' => $path, 'CURRENT' => $current});
      }
  }, $dir;
  $ROOM->param(LogList => \@loglist);
  $ROOM->param(idDir => $id) if($id && $rooms{$id}{'logs-dir'});
}
###################
### 出力
return $ROOM->output;

}

1;