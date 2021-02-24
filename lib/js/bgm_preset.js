(function($){
    const sources = (function(){
        const keys = ['brand', 'album', 'disk', ['track-index', 'trackIndex'], 'title', 'artists', 'tags', 'url', ['default-volume', 'defaultVolume'],];
        const sources = [];

        $('#bgm-preset-source > option').each(
            (_, x) => {
                const $x = $(x);
                const source = {};

                for (const keySet of keys) {
                    const originalKey = keySet instanceof Array ? keySet[0] : keySet;
                    const expectedKey = keySet instanceof Array ? keySet[1] : keySet;
                    var value = $x.attr('data-' + originalKey);

                    if ((originalKey == 'disk' || originalKey == 'track-index') && value != null && value.match(/^\d+$/)) {
                        value = parseInt(value);
                    }

                    source[expectedKey != null ? expectedKey : originalKey] = value == '' || value === undefined ? null : value;
                }

                sources.push(source);
            }
        );

        return sources;
    })();

    const brands = (function(sources){
        function Brand(name){
            this.name = name;
            this.albums = [];
        }
        Brand.prototype.getNumberOfTracks = function(){
            return this.albums.reduce((total, current) => total + current.getNumberOfTracks(), 0);
        };
        Brand.prototype.addAlbum = function(name){
            function Album(name){
                this.name = name;
                this.disks = [];
            }
            Album.prototype.getNumberOfTracks = function(){
                return this.disks.reduce((total, current) => total + current.getNumberOfTracks(), 0);
            };
            Album.prototype.addDisk = function(name){
                function Disk(name){
                    this.name = name;
                    this.screenName = typeof(name) == 'number' ? 'Disk ' + name : name;
                    this.tracks = [];
                }
                Disk.prototype.getNumberOfTracks = function(){
                    return this.tracks.length;
                };
                Disk.prototype.addTrackFromSource = function(source){
                    function Track(source){
                        function formatTrackIndex(value){
                            if (value == null) {
                                return null;
                            }

                            if (typeof(value) != 'number') {
                                return value;
                            }

                            return ('0' + value.toString()).substr(-2);
                        }

                        function makeFullName(source){
                            function joinWithoutEmptyItem(array, separator){
                                return array.filter(x => x !== null && x !== undefined && x != '').join(separator);
                            }

                            return joinWithoutEmptyItem(
                                [
                                    joinWithoutEmptyItem(
                                        [
                                            joinWithoutEmptyItem(
                                                [
                                                    source.brand,
                                                    source.album,
                                                    source.disk,
                                                    formatTrackIndex(source.trackIndex),
                                                ],
                                                '-'
                                            ),
                                            source.title,
                                        ],
                                        ' | '
                                    ),
                                    source.artists,
                                ],
                                ' - by '
                            );
                        }

                        this.title = source.title;
                        this.fullName = makeFullName(source);
                        this.trackIndex = formatTrackIndex(source.trackIndex);
                        this.artists = source.artists;
                        this.tags = source.tags != null ? source.tags.split(/\s*,\s*/) : [];
                        this.url = source.url;
                        this.defaultVolume = source.defaultVolume;
                    }

                    const track = new Track(source);
                    this.tracks.push(track);
                    return track;
                };

                const disk = new Disk(name);
                this.disks.push(disk);
                return disk;
            };

            const album = new Album(name);
            this.albums.push(album);
            return album;
        };

        const brands = [];
        var lastBrand = null;
        var lastAlbum = null;
        var lastDisk = null;

        for (const source of sources) {
            if (lastBrand == null || lastBrand.name != source.brand) {
                lastBrand = new Brand(source.brand);
                brands.push(lastBrand);

                lastAlbum = null;
                lastDisk = null;
            }

            if (lastAlbum == null || lastAlbum.name != source.album) {
                lastAlbum = lastBrand.addAlbum(source.album);

                lastDisk = null;
            }

            if (lastDisk == null || lastDisk.name != source.disk) {
                lastDisk = lastAlbum.addDisk(source.disk);
            }

            lastDisk.addTrackFromSource(source);
        }

        return brands;
    })(sources);

    (function(brands){
        function Stack(){
            this._list = [];
        }
        Stack.prototype.push = function(item){
            this._list.push(item);
        };
        Stack.prototype.pop = function(){
            return this._list.pop();
        };
        Stack.prototype.peek = function(){
            return this._list[this._list.length - 1];
        }
        Stack.prototype.createLayerAndPush = function($, layerId, layerName, numberOfTracks){
            const $layer = $('<ul />');
            $layer.addClass(layerId);
            $layer.attr(`data-${layerId}-name`, layerName);

            this.peek().append(
                $('<li class="group" />')
                .addClass(layerId)
                .append(
                    $('<details open />')
                    .append(
                        $('<summary />')
                        .attr('data-number-of-tracks', numberOfTracks)
                        .text(layerName)
                    )
                    .append($layer)
                )
            );

            this.push($layer);

            return $layer;
        };

        const stack = new Stack();
        stack.push($('#bgm-preset'));

        for (const brand of brands) {
            if (brand.name != null) {
                stack.createLayerAndPush($, 'brand', brand.name, brand.getNumberOfTracks());
            }

            for (const album of brand.albums) {
                if (album.name != null) {
                    stack.createLayerAndPush($, 'album', album.name, album.getNumberOfTracks());
                }

                for (const disk of album.disks) {
                    if (disk.name != null) {
                        stack.createLayerAndPush($, 'disk', disk.screenName, disk.getNumberOfTracks());
                    }

                    for (const track of disk.tracks) {
                        const $track = $('<li class="track" />');

                        $track.attr('data-track-title', track.title);
                        $track.attr('data-track-full-name', track.fullName);

                        if (track.trackIndex != null) {
                            $track.append($('<span class="track-index" />').text(track.trackIndex));
                        }

                        $track.append(track.title != null ? track.title : track.fullName);

                        if (track.artists != null) {
                            $track.append($('<span class="artists" />').text(track.artists));
                        }

                        $track.append($('<span class="volume" />').text(track.defaultVolume));

                        for (const tag of track.tags) {
                            $track.append($('<span class="tag" />').text(tag));
                        }

                        $track.on(
                            'click',
                            (function(track){
                                return function(){
                                    bgmInputSet(track.url, track.fullName, track.defaultVolume);
                                };
                            })(track)
                        );

                        stack.peek().append($track);
                    }

                    if (disk.name != null) {
                        stack.pop();
                    }
                }

                if (album.name != null) {
                    stack.pop();
                }
            }

            if (brand.name != null) {
                stack.pop();
            }
        }
    })(brands);
})($);