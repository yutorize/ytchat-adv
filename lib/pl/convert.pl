################## データ保存 ##################
use strict;
#use warnings;
use utf8;
use open ":utf8";
use LWP::UserAgent;
use JSON::PP;

sub dataGet {
  my $url = shift;
  my $ua  = LWP::UserAgent->new;
  my $res = $ua->get($url);
  if ($res->is_success) {
    return $res->decoded_content;
  }
  else {
    return undef;
  }
}

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
    my $data = dataGet($set_url.'&mode=json') or error 'URLを開けませんでした';
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
    if($pc{'unitStatus'}){
      foreach my $data (@{$pc{'unitStatus'}}){
        if($data eq '|'){
          $result .= '<br>';
        }
        else {
          my $key = (keys %{$data})[0];
          if($key =~ /^(memo|メモ)$/){
            $memo = $data->{$key};
          }
          else {
            push(@stt_name, $key);
            $stt{$key} = $data->{$key};
          }
          $result .= "<b>$key</b>:$data->{$key}　";
        }
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
    my $palette = dataGet($set_url.'&mode=palette') || '';
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