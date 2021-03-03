(function($){
    const sources = (function(){
        const encoded = $('#bgm-preset').attr('data-preset-source');

        if (encoded == null) {
            return [];
        }

        const decoded = JSON.parse(decodeURIComponent(encoded));

        return decoded;
    })();

    const makeId = (function(){
        var serial = 1;
        return function(){
            return 'id_' + (serial++).toString();
        };
    })();

    function Track(source){
        function formatDiskName(value){
            if (value == null) {
                return null;
            }

            if (typeof(value) != 'number') {
                return value;
            }

            return `Disk ${value}`;
        }

        function formatTrackIndex(value){
            if (value == null) {
                return null;
            }

            if (value.toString().match(/^\d+$/)) {
                return ('0' + value.toString()).substr(-2);
            }

            return value;
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

        this.id = makeId();
        this.brand = source.brand != null ? source.brand : null;
        this.album = source.album != null ? source.album : null;
        this.disk = formatDiskName(source.disk);
        this.title = source.title != null ? source.title : null;
        this.fullName = makeFullName(source);
        this.trackIndex = formatTrackIndex(source.trackIndex);
        this.artists = source.artists != null ? source.artists : null;
        this.tags = source.tags != null ? source.tags.split(/\s*,\s*/) : [];
        this.url = source.url != null ? source.url : null;
        this.defaultVolume = source.volume != null ? source.volume : 100;
    }
    Track.prototype.matchFilter = function(filter){
        return filter == null ||
               filter == '' ||
               [this.brand, this.album, this.disk, this.trackIndex, this.title, this.artists]
                   .concat(this.tags)
                   .filter(x => x != null && x != '')
                   .some(x => x.toString().indexOf(filter) >= 0 || x.toString().toLowerCase().indexOf(filter.toLowerCase()) >= 0);
    };

    function TrackGroup(groupingKey, groupingValue){
        this.id = makeId();
        this.groupingKey = groupingKey;
        this.groupingValue = groupingValue;
        this.items = [];
    }
    TrackGroup.prototype.getNumberOfTracks = function(){
        var total = 0;

        for (const item of this.items) {
            if (item instanceof TrackGroup) {
                total += item.getNumberOfTracks();
            } else {
                total++;
            }
        }

        return total;
    };
    TrackGroup.prototype.addGroup = function(groupingKey, groupingValue){
        const group = new TrackGroup(groupingKey, groupingValue);
        this.items.push(group);
        return group;
    };
    TrackGroup.prototype.addTrackFromSource = function(source){
        const track = new Track(source);
        this.items.push(track);
        return track;
    };

    const groupingRoot = (function(sources){
        function mergeObjects(first, second){
            const o = {};
            Object.assign(o, first);
            Object.assign(o, second);
            return o;
        }

        function build(sources, parent, metadata){
            for (const source of sources) {
                if (source instanceof Array) {
                    // 旧フォーマット

                    (function(array, parent, metadata){
                        const source = mergeObjects(
                            metadata,
                            {
                                url: array[0],
                                title: array[1],
                                volume: array[2]
                            }
                        );

                        if (parent instanceof TrackGroup) {
                            parent.addTrackFromSource(source);
                        } else {
                            parent.push(new Track(source));
                        }
                    })(source, parent, metadata);
                } else {
                    // 新フォーマット

                    const children = source['tracks'];

                    if (children == null) {
                        // トラック

                        if (parent instanceof TrackGroup) {
                            parent.addTrackFromSource(mergeObjects(metadata, source));
                        } else {
                            parent.push(new Track(mergeObjects(metadata, source)));
                        }
                    } else {
                        // グループ

                        const groupingKey = (function(source){
                            for (const key of Object.keys(source)) {
                                if (key != 'tracks') {
                                    return key;
                                }
                            }

                            console.warn("Grouping key is not found.");
                            return null;
                        })(source);

                        if (groupingKey == null) {
                            continue;
                        }

                        const groupingValue = (function(source, groupingKey){
                            const groupingValue = source[groupingKey];

                            if (groupingKey == 'disk' && groupingValue != null && groupingValue.toString().match(/^\d+$/)) {
                                return `Disk ${groupingValue}`;
                            }

                            return groupingValue;
                        })(source, groupingKey);

                        const group = (
                            parent instanceof TrackGroup
                                ? parent.addGroup(groupingKey, groupingValue)
                                : new TrackGroup(groupingKey, groupingValue)
                        );

                        if (parent instanceof Array) {
                            parent.push(group);
                        }

                        const nextMetadata = {};
                        if (metadata != null) {
                            Object.assign(nextMetadata, metadata);
                        }
                        nextMetadata[groupingKey] = groupingValue;

                        build(children, group, nextMetadata);
                    }
                }
            }
            
            return parent;
        }

        return build(sources, []);
    })(sources);

    const nodes = (function(groupingRoot){
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
        Stack.prototype.createLayerAndPush = function($, layerId, layerName){
            const $layer = $('<ul />');
            $layer.addClass(layerId);
            $layer.attr(`data-${layerId}-name`, layerName);

            const $summary = $('<summary />').text(layerName);

            const $li = $('<li class="group" />')
            .addClass(layerId)
            .append(
                $('<details open />')
                .append($summary)
                .append($layer)
            );

            this.peek().append($li);

            this.push($layer);

            return {li: $li, summary: $summary};
        };

        const stack = new Stack();
        stack.push($('#bgm-preset'));

        const nodes = {};

        (function(root, stack, nodes){
            function createNodes(current, groupingKeys){
                if (groupingKeys == null) {
                    return createNodes(current, []);
                }

                const array = current instanceof TrackGroup ? current.items : current;

                for (const item of array) {
                    if (item instanceof TrackGroup) {
                        nodes[item.id] = stack.createLayerAndPush($, item.groupingKey, item.groupingValue);

                        createNodes(item, groupingKeys.concat([item.groupingKey]));

                        stack.pop();
                    } else if (item instanceof Track) {
                        const $track = $('<li class="track" />');

                        $track.attr('data-track-title', item.title);
                        $track.attr('data-track-full-name', item.fullName);

                        if (item.trackIndex != null) {
                            $track.append($('<span class="track-index" />').text(item.trackIndex));
                        }

                        $track.append(item.title != null ? item.title : item.fullName);

                        if (item.artists != null && !groupingKeys.includes('artists')) {
                            $track.append($('<span class="artists" />').text(item.artists));
                        }

                        $track.append($('<span class="volume" />').text(item.defaultVolume));

                        for (const tag of item.tags) {
                            $track.append($('<span class="tag" />').text(tag));
                        }

                        $track.on(
                            'click',
                            (function(track){
                                return function(){
                                    bgmInputSet(track.url, track.fullName, track.defaultVolume);
                                };
                            })(item)
                        );

                        stack.peek().append($track);

                        nodes[item.id] = $track;
                    } else {
                        throw new Error();
                    }
                }
            }

            createNodes(root);
        })(groupingRoot, stack, nodes);

        return nodes;
    })(groupingRoot);

    (function(groupingRoot, nodes, $filterField, $noticeOnNotFound, $buttonToClear){
        function applyFilter(group, filterCondition){
            const array = group instanceof TrackGroup ? group.items : group;

            var numberOfAvailableTracks = 0;

            for (const item of array) {
                if (item instanceof TrackGroup) {
                    const numberOfAvailableTracksInGroup = applyFilter(item, filterCondition);

                    if (numberOfAvailableTracksInGroup > 0) {
                        nodes[item.id].li.removeClass('hidden');
                    } else {
                        nodes[item.id].li.addClass('hidden');
                    }

                    nodes[item.id].summary.attr('data-number-of-available-tracks', numberOfAvailableTracksInGroup);

                    numberOfAvailableTracks += numberOfAvailableTracksInGroup;
                } else if (item instanceof Track) {
                    if (item.matchFilter(filterCondition)) {
                        nodes[item.id].removeClass('hidden');
                        numberOfAvailableTracks++;
                    } else {
                        nodes[item.id].addClass('hidden');
                    }
                } else {
                    throw new Error();
                }
            }

            return numberOfAvailableTracks;
        }

        $filterField.on(
            'input',
            x => {
                const filterCondition = (function(condition){
                    return condition.match(/^[\s　]*$/) ? '' : condition;
                })($filterField.val());

                const numberOfAllAvailableTracks = applyFilter(groupingRoot, filterCondition);

                if (numberOfAllAvailableTracks > 0) {
                    $noticeOnNotFound.addClass('hidden');
                } else {
                    $noticeOnNotFound.removeClass('hidden');
                }

                if (filterCondition == '') {
                    $buttonToClear.addClass('hidden');
                } else {
                    $buttonToClear.removeClass('hidden');
                }
            }
        );

        $buttonToClear.on(
            'click',
             () => {
                 $filterField.val('');
                 $filterField.trigger('input');
             }
        );

        $filterField.trigger('input');
    })(
        groupingRoot,
        nodes, $('#bgm_preset_filter'),
        $('#notice_on_present_not_found'),
        $('.bgm-preset-filter > .to-clear')
    );
})($);