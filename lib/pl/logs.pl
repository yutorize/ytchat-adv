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

my @tabs = split(',', $rooms{$id}{'tab'});

###################
### 部屋の有無をチェック
error('ルームがありません') if !exists($rooms{$id});

###################
### ディレクトリが無い場合
if (!-d "./room/${id}"){
  error('ログデータがありません');
}

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
### ログ本体

$ROOM->param(roomId => $id);
$ROOM->param(title => $rooms{$id}{'name'});

my $logfile = $::in{"date"} ? "./logs/".$::in{"date"}.".dat" : "./room/${id}/log-all.dat";
sysopen (my $FH, $logfile, O_RDONLY);
my @logs;
my $before_tab;
my $before_name;
my $before_color;
my $before_user;
foreach (<$FH>){
  my ($num, $date, $tab, $name, $color, $comm, $info, $system, $user) = split(/<>/, $_);
  
     $user =~ s/<.+?>$//;
  my $type = ($system =~ /^check|round/) ? 'dice' : ($system) ? $system : 'dice';
     $type =~ s/:.*?$//;
  my $game;
  if($info){
    if($system =~ /^dice/){
      $info =~ s|(\[.*?\])|<i>$1</i>|g;
      $info =~ s| = ([0-9a-z.∞]+)$| = <strong>$1</strong>|gi;
      $info =~ s| = ([0-9a-z.]+)| = <b>$1</b>|gi;
      #クリティカルをグラデにする
      my $crit = () = $info =~ s/(クリティカル!\])/$1<em>/g;
      while($crit > 0){ $info .= "</em>"; $crit--; }
      #ファンブル用の色適用
      if($info =~ /1ゾロ|ファンブル/){ $info = "<em class='fail'>$info</em>"; }
      #
      $info =~ s/\{(.*?)\}/{<span class='division'>$1<\/span>}/;
    }
    if($system =~ /^unit/){
      $info =~ s| (\[.*?\])| <i>$1</i>|g;
    }
  }
  
  
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
### 出力
print "Content-Type: text/html\n\n";
print $ROOM->output;

exit;

1;