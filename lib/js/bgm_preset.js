(()=> {
    const sources = (() => {
        const encoded = document.getElementById('bgm-preset').getAttribute('data-preset-source');

        if (encoded == null || encoded === '') {
            return [];
        }

        return JSON.parse(decodeURIComponent(encoded));
    })();

    const makeId = (() => {
        let serial = 1;
        return function () {
            return 'id_' + (serial++).toString();
        };
    })();

    function Track(source) {
        function formatDiskName(value) {
            if (value == null) {
                return null;
            }

            if (typeof (value) != 'number') {
                return value;
            }

            return `Disk ${value}`;
        }

        function formatTrackIndex(value) {
            if (value == null) {
                return null;
            }

            if (value.toString().match(/^\d+$/)) {
                return ('0' + value.toString()).substr(-2);
            }

            return value;
        }

        function makeFullName(source) {
            function joinWithoutEmptyItem(array, separator) {
                return array.filter(x => x !== null && x !== undefined && x !== '').join(separator);
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

    Track.prototype.matchFilter = function (filter) {
        return filter == null ||
            filter === '' ||
            [this.brand, this.album, this.disk, this.trackIndex, this.title, this.artists]
                .concat(this.tags)
                .filter(x => x != null && x !== '')
                .some(
                    x => x.toString().indexOf(filter) >= 0 ||
                        x.toString().toLowerCase().indexOf(filter.toLowerCase()) >= 0
                );
    };

    function TrackGroup(groupingKey, groupingValue) {
        this.id = makeId();
        this.groupingKey = groupingKey;
        this.groupingValue = groupingValue;
        this.items = [];
    }

    TrackGroup.prototype.getNumberOfTracks = function () {
        let total = 0;

        for (const item of this.items) {
            if (item instanceof TrackGroup) {
                total += item.getNumberOfTracks();
            } else {
                total++;
            }
        }

        return total;
    };
    TrackGroup.prototype.addGroup = function (groupingKey, groupingValue) {
        const group = new TrackGroup(groupingKey, groupingValue);
        this.items.push(group);
        return group;
    };
    TrackGroup.prototype.addTrackFromSource = function (source) {
        const track = new Track(source);
        this.items.push(track);
        return track;
    };

    const groupingRoot = (sources => {
        function mergeObjects(first, second) {
            const o = {};
            Object.assign(o, first);
            Object.assign(o, second);
            return o;
        }

        function build(sources, parent, metadata) {
            for (const source of sources) {
                if (source instanceof Array) {
                    // 旧フォーマット

                    (function (array, parent, metadata) {
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

                        const groupingKey = (function (source) {
                            for (const key of Object.keys(source)) {
                                if (key !== 'tracks') {
                                    return key;
                                }
                            }

                            console.warn("Grouping key is not found.");
                            return null;
                        })(source);

                        if (groupingKey == null) {
                            continue;
                        }

                        const groupingValue = (function (source, groupingKey) {
                            const groupingValue = source[groupingKey];

                            if (groupingKey === 'disk' && groupingValue != null && groupingValue.toString().match(/^\d+$/)) {
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

    const nodes = (function (groupingRoot) {
        function Stack() {
            this._list = [];
        }

        Stack.prototype.push = function (item) {
            this._list.push(item);
        };
        Stack.prototype.pop = function () {
            return this._list.pop();
        };
        Stack.prototype.peek = function () {
            return this._list[this._list.length - 1];
        }
        Stack.prototype.createLayerAndPush = function (layerId, layerName) {
            const layerNode = document.createElement('ul');
            layerNode.classList.add(layerId);
            layerNode.setAttribute(`data-${layerId}-name`, layerName);

            const summaryNode = document.createElement('summary');
            summaryNode.textContent = layerName;

            const detailsNode = document.createElement('details');
            detailsNode.setAttribute('open', '');
            detailsNode.append(summaryNode, layerNode);

            const itemNode = document.createElement('li');
            itemNode.classList.add('group', layerId);
            itemNode.append(detailsNode);

            this.peek().append(itemNode);

            this.push(layerNode);

            return {li: itemNode, summary: summaryNode};
        };

        const stack = new Stack();
        stack.push(document.getElementById('bgm-preset'));

        const nodes = {};

        ((root, stack, nodes) => {
            function createNodes(current, groupingKeys) {
                if (groupingKeys == null) {
                    return createNodes(current, []);
                }

                const array = current instanceof TrackGroup ? current.items : current;

                for (const item of array) {
                    if (item instanceof TrackGroup) {
                        nodes[item.id] = stack.createLayerAndPush(item.groupingKey, item.groupingValue);

                        createNodes(item, groupingKeys.concat([item.groupingKey]));

                        stack.pop();
                    } else if (item instanceof Track) {
                        const trackNode = document.createElement('li');
                        trackNode.classList.add('track');
                        trackNode.setAttribute('data-track-title', item.title);
                        trackNode.setAttribute('data-track-full-name', item.fullName);

                        const trackIconNode = document.createElement('span');
                        trackIconNode.classList.add('material-symbols-outlined', 'icon');
                        trackIconNode.textContent = 'audio_file';
                        trackNode.append(trackIconNode);

                        if (item.trackIndex != null) {
                            const trackIndexNode = document.createElement('span');
                            trackIndexNode.classList.add('track-index');
                            trackIndexNode.textContent = item.trackIndex;
                            trackNode.append(trackIndexNode);
                        }

                        trackNode.append(item.title != null ? item.title : item.fullName);

                        if (item.artists != null && !groupingKeys.includes('artists')) {
                            const artistsNode = document.createElement('span');
                            artistsNode.classList.add('artists');
                            artistsNode.textContent = item.artists;
                            trackNode.append(artistsNode);
                        }

                        const volumeNode = document.createElement('span');
                        volumeNode.classList.add('volume');
                        volumeNode.textContent = item.defaultVolume;
                        trackNode.append(volumeNode);

                        const volumeIconNode = document.createElement('span');
                        volumeIconNode.classList.add('material-symbols-outlined', 'icon');
                        volumeIconNode.textContent = 'volume_up';
                        volumeNode.prepend(volumeIconNode);

                        for (const tag of item.tags) {
                            const tagNode = document.createElement('span');
                            tagNode.classList.add('tag');
                            tagNode.textContent = tag;
                            trackNode.append(tagNode);
                        }

                        trackNode.addEventListener(
                            'click',
                            (track => {
                                return () => bgmInputSet(track.url, track.fullName, track.defaultVolume);
                            })(item)
                        );

                        stack.peek().append(trackNode);

                        nodes[item.id] = trackNode;
                    } else {
                        throw new Error();
                    }
                }
            }

            createNodes(root);
        })(groupingRoot, stack, nodes);

        return nodes;
    })(groupingRoot);

    const classNameToHide = 'hidden';

    function makeFilter(groupingRoot, nodes, filterField, noticeOnNotFound, buttonToClear) {
        function applyFilter(group, filterCondition) {
            const array = group instanceof TrackGroup ? group.items : group;

            let numberOfAvailableTracks = 0;

            for (const item of array) {
                if (item instanceof TrackGroup) {
                    const numberOfAvailableTracksInGroup = applyFilter(item, filterCondition);

                    if (numberOfAvailableTracksInGroup > 0) {
                        nodes[item.id].li.classList.remove(classNameToHide);
                    } else {
                        nodes[item.id].li.classList.add(classNameToHide);
                    }

                    nodes[item.id].summary.setAttribute(
                        'data-number-of-available-tracks',
                        numberOfAvailableTracksInGroup.toString()
                    );

                    numberOfAvailableTracks += numberOfAvailableTracksInGroup;
                } else if (item instanceof Track) {
                    if (item.matchFilter(filterCondition)) {
                        nodes[item.id].classList.remove(classNameToHide);
                        numberOfAvailableTracks++;
                    } else {
                        nodes[item.id].classList.add(classNameToHide);
                    }
                } else {
                    throw new Error();
                }
            }

            return numberOfAvailableTracks;
        }

        filterField.addEventListener(
            'input',
            () => {
                const filterCondition = (condition => {
                    return condition.match(/^[\s　]*$/) ? '' : condition;
                })(filterField.value);

                const numberOfAllAvailableTracks = applyFilter(groupingRoot, filterCondition);

                if (numberOfAllAvailableTracks > 0) {
                    noticeOnNotFound.classList.add(classNameToHide);
                } else {
                    noticeOnNotFound.classList.remove(classNameToHide);
                }

                if (filterCondition === '') {
                    buttonToClear.classList.add(classNameToHide);
                } else {
                    buttonToClear.classList.remove(classNameToHide);
                }
            }
        );

        buttonToClear.addEventListener(
            'click',
            () => {
                filterField.value = '';
                filterField.dispatchEvent(new InputEvent('input'));
            }
        );

        filterField.dispatchEvent(new InputEvent('input'));
    }

    makeFilter(
        groupingRoot,
        nodes,
        document.getElementById('bgm_preset_filter'),
        document.getElementById('notice_on_present_not_found'),
        document.querySelector('.bgm-preset-filter > .to-clear')
    );

    if (document.querySelector('#bgm-set .restriction-area') != null) {
        document.getElementById('bgm-set').classList.add('contains-restriction');
    }
})();
