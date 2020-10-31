################## データ保存 ##################
use strict;
#use warnings;
use utf8;
use open ":utf8";
use LWP::Simple;
use JSON::PP;

sub dataConvert {
  my $set_url = shift;
  
  ### キャラクター保管所
  #if($set_url =~ m"^https?://charasheet\.vampire-blood\.net/"){
  #  my $data = get($set_url.'.js') or error 'キャラクター保管所のデータが取得できませんでした:'.$file;
  #  my %in = %{ decode_json(encode('utf8', (join '', $data))) };
  #  
  #  return convertHokanjoToYtsheet(\%in);
  #}
  ### キャラクター保管所
  #if($set_url =~ m"^https?://character-sheets\.appspot\.com/dx3/edit.html"){
  #  $set_url =~ s/edit\.html\?/display\?ajax=1&/;
  #  my $data = get($set_url) or error 'キャラクターシート倉庫のデータが取得できませんでした:'.$file;
  #  my %in = %{ decode_json(encode('utf8', (join '', $data))) };
  #  
  #  return convertSoukoToYtsheet(\%in);
  #}
  ## ゆとシートⅡ
  {
    my $data = get($set_url.'&mode=json') or error 'URLを開けませんでした';
    my $json;
    eval { $json = decode_json(join '', $data); };
    if ($@) { error('ステータスの取得できる参照先ではありません'); }
    my %pc = %{ $json };
    error('有効なキャラクターシートではありません') if !$pc{'ver'};
    my %stt;
    my @stt_name;
    my $memo;
    my $result;
    my $game = $::in{'game'};
    # SW魔物データ
    if($pc{'monsterName'}){
      # 部位名チェック
      my @n2a = ('','A' .. 'Z');
      if($pc{'statusNum'} > 1){
        my %multiple;
        foreach my $i (1 .. $pc{'statusNum'}){
          $pc{"part${i}"} = $pc{"status${i}Style"};
          $pc{"part${i}"} =~ s/^.+[(（)](.+?)[)）]$/$1/;
          $multiple{ $pc{"part${i}"} }++;
        }
        my %count;
        foreach my $i (1 .. $pc{'statusNum'}){
          if($multiple{ $pc{"part${i}"} } > 1){
            $count{ $pc{"part${i}"} }++;
            $pc{"part${i}"} .= $n2a[$i];
          }
        }
      }
      #
      foreach my $i (1 .. $pc{'statusNum'}){
        my $part = ($pc{'statusNum'} > 1) ? $pc{"part${i}"}.':' : '';
        $stt{ $part.'HP' } = numConvert($pc{"status${i}Hp"});
        $stt{ $part.'MP' } = numConvert($pc{"status${i}Mp"});
        push(@stt_name, $part.'HP') if $stt{ $part.'HP' };
        push(@stt_name, $part.'MP') if $stt{ $part.'MP' };
        $result .= "<b>${part}HP</b>:$stt{ $part.'HP' }　<b>${part}MP</b>:$stt{ $part.'MP' }";
        if($pc{'statusNum'} == 1) {
          $stt{'防護'} .= $pc{"status${i}Defense"};
          push(@stt_name, '防護') if $stt{ '防護' };
          $result .= "　<b>防護</b>:$stt{ $part.'HP' }";
        }
        else {
          $memo .= ($memo?'／':'').$part.$pc{"status${i}Defense"};
        }
        $result .= '<br>';
      }
      if($memo){
        $memo = '防護:'.$memo;
        $result .= "<b>メモ</b>:$memo";
      }
    }
    # 他
    else {
      @stt_name = @{$set::games{$game}{'status'}};
      foreach my $label (@stt_name){
        my @value;
        push(@value, $pc{$_}) foreach @{ $set::games{$game}{'convert'}{$label} };
        $stt{$label} = join("/", @value);
        $result .= ($result ? '　' : '') . "<b>$label</b>:$stt{$label}";
      }
    }
    # 名前
    my $aka  = rubyConvert( $pc{'aka'} );
    my $name = rubyConvert( $pc{'characterName'} || $pc{'monsterName'} );
    # プロフィール
    my $profile = textConvert($pc{'sheetDescriptionM'});
    # 画像
    my $img;
    if($pc{'image'}){
      my $fit = $pc{'imageFit'};
      if   ($fit eq 'percentY')   { $fit = 'auto '.$pc{'imagePercent'}*1.3 .'%'; }
      elsif($fit =~ /^percentX?$/){ $fit =         $pc{'imagePercent'}*1.3 .'%'; }
      $fit = "background-size:$fit;" if $fit;
      my $position = "background-position:$pc{imagePositionX}% $pc{imagePositionY}%;";
      $img = "<div class=\"chara-image\" style=\"background:url($pc{'imageURL'});${fit}${position}\"></div>";
    }
    $result = ($img || '')
            . "<a href=\"${set_url}\" target=\"_blank\">".($aka?"“$aka”":'')."$name</a><br>"
            . ($profile ? $profile.'<br>':'')
            . $result;
    # チャットパレット取得
    my $palette = get($set_url.'&mode=palette') || '';
    # 最終
    my %data = (
      'url' => $set_url,
      'status' => \%stt,
      'sttnames' => \@stt_name,
      'memo' => ($memo || ''),
      'palette' => $palette,
    );
    return (\%data, $result);
  }
}
sub rubyConvert {
  my ($text, $ruby) = split(':', shift);
  if($ruby){
    return "<ruby>$text<rt>$ruby</rt></ruby>";
  }
  else {
    $text =~ s#[|｜](.+?)《(.+?)》#<ruby>$1<rt>$2</rt></ruby>#g;
    return $text;
  }
}
sub textConvert {
  my $text = shift;
  $text =~ s#[|｜](.+?)《(.+?)》#<ruby>$1<rt>$2</rt></ruby>#g;
  $text =~ s/&lt;br&gt;|\n/<br>/gi;
  return $text;
}
sub numConvert {
  my $text = shift;
  if($text =~ /^[0-9]+$/ && $text > 0) {
    return "$text/$text";
  }
  elsif($text =~ /^[\-ー－―×]$/){
    return "";
  }
  else { return $text; }
}

## タグ：全角スペース・英数を半角に変換 --------------------------------------------------
sub convertTags {
  my $tags = shift;
  $tags =~ tr/　/ /;
  $tags =~ tr/０-９Ａ-Ｚａ-ｚ/0-9A-Za-z/;
  $tags =~ tr/＋－＊／．，＿/\+\-\*\/\.,_/;
  $tags =~ tr/ / /s;
  return $tags
}

1;