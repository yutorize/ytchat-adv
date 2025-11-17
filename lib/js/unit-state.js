class GameDuration {
    static #re = /^(\d+)?(\D.*?)$/;

    static NaN = new GameDuration(null, '');

    /** @var {int|null} */
    #number;

    /** @var {string} */
    #unit;

    /**
     * @param {string} text
     * @return {boolean}
     */
    static canParse(text) {
        return this.#re.test(text);
    }

    /**
     * @param {string} source
     * @return {GameDuration}
     */
    static parse(source) {
        const m = source.match(this.#re);

        if (m == null) {
            throw new Error(`Can not parse unit. (source: ${source})`);
        }

        return new GameDuration(m[1] ? parseInt(m[1]) : null, m[2]);
    }

    /**
     * @param {int|null} number
     * @param {string} unit
     */
    constructor(number, unit) {
        this.#number = number != null ? typeof number === 'number' ? number : parseInt(number.toString()) : null;
        this.#unit = unit;
    }

    /**
     * @return {int|null}
     */
    get number() {
        return this.#number;
    }

    /**
     * @return {string}
     */
    get unit() {
        return this.#unit;
    }

    toString() {
        return `${this.number ?? ''}${this.unit}`;
    }
}

class UnitContinuationStateIcon {
    /** @var {string} */
    #category;

    /** @var {string|null} */
    #direction;

    /**
     * @param {string} category
     * @param {string|null} direction
     */
    constructor(category, direction = null) {
        this.#category = category;
        this.#direction = direction ?? null;
    }

    /**
     * @return {string}
     */
    get category() {
        return this.#category;
    }

    /**
     * @return {string|null}
     */
    get direction() {
        return this.#direction;
    }
}

class UnitContinuationState {
    /** @var {string} */
    #id;

    /** @var {string} */
    #name;

    /** @var {GameDuration} */
    #duration;

    /** @var {int|null} */
    #occurrenceRound;

    /** @var {string|null} */
    #source;

    /** @var {UnitContinuationStateIcon|null} */
    #icon;

    /** @var {Object<string, string>} */
    #additionalFields = {};

    /** @var {string|null} */
    #description;

    /**
     * @param {string} id
     * @param {string} name
     * @param {GameDuration|string} duration
     * @param {int|null} occurrenceRound
     * @param {string|null} source
     * @param {{category: string, direction?: string|null}|null} icon
     * @param {Object<string, string>} additionalFields
     * @param {string|null} description
     */
    constructor(
        id,
        name,
        duration,
        occurrenceRound,
        source,
        icon,
        additionalFields,
        description
    ) {
        try {
            this.#id = id;
            this.#name = name;
            this.#duration = duration instanceof GameDuration ? duration : GameDuration.parse(duration);
            this.#occurrenceRound = occurrenceRound;
            this.#source = source;
            this.#icon =
                icon != null
                    ? new UnitContinuationStateIcon(icon.category, icon.direction)
                    : null;
            this.#description = description;

            for (const [key, value] of Object.entries(additionalFields)) {
                this.#additionalFields[key] = value;
            }
        } catch (e) {
            console.warn([id, name, duration, occurrenceRound, source, icon, description]);
            throw e;
        }
    }

    /**
     * @return {string}
     */
    get id() {
        return this.#id;
    }

    /**
     * @return {string}
     */
    get name() {
        return this.#name;
    }

    /**
     * @return {GameDuration}
     */
    get duration() {
        return this.#duration;
    }

    /**
     * @return {int|null}
     */
    get occurrenceRound() {
        return this.#occurrenceRound ?? null;
    }

    /**
     * @return {string|null}
     */
    get source() {
        return this.#source;
    }

    /**
     * @return {UnitContinuationStateIcon|null}
     */
    get icon() {
        return this.#icon;
    }

    /**
     * @return {string|null}
     */
    get description() {
        return this.#description;
    }

    /**
     * @return {Object<string, string>}
     */
    get additionalFields() {
        const o = {};
        for (const [k, v] of Object.entries(this.#additionalFields)) {
            o[k] = v;
        }
        return o;
    }
}

/**
 * @param {string} unitName
 * @return {Array<UnitContinuationState>}
 */
function loadUnitStates(unitName) {
    if (unitName in unitList && 'states' in unitList[unitName]) {
        return unitList[unitName]['states']
            .filter(x => x != null && x['id'] != null)
            .map(
                x => {
                    const additionalFields = {};

                    if (x['additionalFieldNames'] != null) {
                        for (const key of x['additionalFieldNames']) {
                            if (x[key] != null && x[key] !== '') {
                                additionalFields[key] = x[key];
                            }
                        }
                    }

                    return new UnitContinuationState(
                        x['id'],
                        x['name'],
                        new GameDuration(
                            x['duration']['value'],
                            x['duration']['unit']
                        ),
                        x['occurrenceRound'],
                        x['source'],
                        x['icon'],
                        additionalFields,
                        x['description']
                    );
                }
            );
    }

    return [];
}

/**
 * @param {UnitContinuationState} state
 * @return {HTMLElement}
 */
function createUnitStateIconNode(state) {
    const node = document.createElement('span');

    node.classList.add('state-icon');
    node.dataset.iconCategory = state.icon != null ? state.icon.category : '';
    node.dataset.iconDirection = state.icon != null ? state.icon.direction ?? '' : '';
    node.dataset.stateName = state.name;

    return node;
}

/**
 * @param {UnitContinuationState} state
 * @return {HTMLElement}
 */
function createUnitStateNameNode(state) {
    const node = document.createElement('span');

    node.classList.add('state-name');
    node.textContent = state.name;
    node.dataset.stateName = state.name;

    return node;
}

/**
 * @param {UnitContinuationState} state
 * @return {HTMLElement}
 */
function createUnitStateDurationNode(state) {
    const durationNode = document.createElement('div');

    durationNode.classList.add('state-duration');
    durationNode.dataset.stateName = state.name;

    {
        const durationNumberNode = document.createElement('span');
        durationNumberNode.classList.add('duration-number');
        durationNumberNode.textContent = state.duration.number?.toString() ?? '';
        durationNode.appendChild(durationNumberNode);
    }

    {
        const durationUnitNode = document.createElement('span');
        durationUnitNode.classList.add('duration-unit');
        durationUnitNode.textContent = state.duration.unit;

        if (state.duration.unit != null && state.duration.unit !== '') {
            durationUnitNode.dataset.value = state.duration.unit;
        }

        durationNode.appendChild(durationUnitNode);
    }

    {
        const occurrenceRoundNode = document.createElement('div');
        occurrenceRoundNode.classList.add('occurrence-round');
        occurrenceRoundNode.textContent = state.occurrenceRound?.toString() ?? '';
        durationNode.appendChild(occurrenceRoundNode);
    }

    return durationNode;
}

/**
 * @param {UnitContinuationState} state
 * @param {string} targetUnitName
 * @return {HTMLElement}
 */
function createUnitStateSourceNode(state, targetUnitName) {
    const node = document.createElement('div');

    node.classList.add('state-source-name');
    node.textContent = state.source ?? '';
    node.dataset.sourceName = state.source ?? '';
    node.dataset.sourceIsSelf =
        (state.source ?? '') !== '' && state.source === targetUnitName ? 'yes' : 'no';
    node.dataset.stateName = state.name;

    return node;
}

/**
 * @param {UnitContinuationState} state
 * @return {HTMLElement}
 */
function createUnitStateAdditionalFieldsNode(state) {
    const node = document.createElement('ul');
    node.classList.add('additional-fields');
    node.dataset.stateName = state.name;

    for (const [key, value] of Object.entries(state.additionalFields)) {
        const li = document.createElement('li');
        li.textContent = `${key}：${value}`;
        node.appendChild(li);
    }

    return node;
}

/**
 * @param {UnitContinuationState} state
 * @return {HTMLElement}
 */
function createUnitStateDescriptionNode(state) {
    const node = document.createElement('div');

    node.classList.add('state-description');
    node.dataset.stateName = state.name;

    if (state.description != null && state.description !== '') {
        state.description.split('\n').forEach(
            line => {
                const p = document.createElement('p');
                p.textContent = line;

                node.appendChild(p);
            }
        );
    }

    return node;
}

/**
 * @param {string} unitId
 * @return {{stateCount: int}}
 */
function updateUnitState(unitId) {
    const unitNode = document.getElementById(`stt-unit-${unitId}`);

    unitNode.querySelectorAll('.state').forEach(x => x.remove());

    const unitName = unitNode.querySelector('.chara-name').textContent.trim();

    let stateCount = 0;

    for (const state of loadUnitStates(unitName)) {
        const stateNode =
            unitNode.querySelector(`.state[data-state-id="${state.id}"]`) ??
            (state => {
                const dd = document.createElement('dd');
                dd.classList.add('state', 'tooltip');
                dd.dataset.stateId = state.id;
                dd.dataset.stateName = state.name;
                dd.dataset.stateSource = state.source ?? '';

                const iconNode = createUnitStateIconNode(state);
                dd.appendChild(iconNode);

                const stateNameNode = createUnitStateNameNode(state);
                dd.appendChild(stateNameNode);

                const durationNode = createUnitStateDurationNode(state);
                dd.appendChild(durationNode);

                const tooltip = document.createElement('div');
                tooltip.classList.add('tooltip-text');

                const tooltipHeader = document.createElement('div');
                tooltipHeader.classList.add('state-header');
                tooltipHeader.appendChild(iconNode.cloneNode(true));
                tooltipHeader.appendChild(stateNameNode.cloneNode(true));
                tooltipHeader.dataset.iconKind = iconNode.dataset.iconKind ?? '';
                tooltip.appendChild(tooltipHeader);

                const sourceNameNode = createUnitStateSourceNode(state, unitName);
                tooltip.appendChild(sourceNameNode);

                tooltip.appendChild(durationNode.cloneNode(true));

                const additionalFieldsNode = createUnitStateAdditionalFieldsNode(state);
                tooltip.appendChild(additionalFieldsNode);

                const descriptionNode = createUnitStateDescriptionNode(state);
                tooltip.appendChild(descriptionNode);

                dd.appendChild(tooltip);
                dd.addEventListener('mouseover', event => tooltipHover(event));

                dd.addEventListener(
                    'click',
                    () => {
                        dd.classList.add('state-selected');

                        const stateControllerNode = document.createElement('div');
                        stateControllerNode.classList.add('state-controller', 'status-manipulator');

                        const controllerHeader = tooltipHeader.cloneNode(true);

                        {
                            const targetNameNode = document.createElement('div');
                            targetNameNode.classList.add('state-target-name');
                            targetNameNode.textContent = unitName;
                            controllerHeader.prepend(targetNameNode);
                        }

                        stateControllerNode.appendChild(controllerHeader);

                        stateControllerNode.appendChild(sourceNameNode.cloneNode(true));

                        {
                            const durationArea = durationNode.cloneNode(true);

                            if (state.duration.number != null) {
                                const buttonToIncrease = document.createElement('button');
                                buttonToIncrease.classList.add('to-increase');
                                buttonToIncrease.dataset.unit = state.duration.unit;
                                durationArea.appendChild(buttonToIncrease);

                                const buttonToDecrease = document.createElement('button');
                                buttonToDecrease.classList.add('to-decrease');
                                buttonToDecrease.dataset.unit = state.duration.unit;
                                durationArea.appendChild(buttonToDecrease);

                                buttonToIncrease.addEventListener(
                                    'click',
                                    async () => {
                                        const operation = new StateOperationToModify();
                                        operation.targets.stateId = state.id;
                                        operation.duration.mode = 'increment';
                                        operation.duration.value = `1${state.duration.unit}`;

                                        await sendStateCommand(operation.buildCommand());
                                    }
                                );

                                buttonToDecrease.addEventListener(
                                    'click',
                                    async () => {
                                        const operation = new StateOperationToModify();
                                        operation.targets.stateId = state.id;
                                        operation.duration.mode = 'decrement';
                                        operation.duration.value = `1${state.duration.unit}`;

                                        await sendStateCommand(operation.buildCommand());
                                    }
                                );
                            }

                            stateControllerNode.appendChild(durationArea);
                        }

                        stateControllerNode.appendChild(additionalFieldsNode.cloneNode(true));

                        stateControllerNode.appendChild(descriptionNode.cloneNode(true));

                        {
                            const buttonToRemoveState = document.createElement('button');
                            buttonToRemoveState.classList.add('to-remove-state');
                            buttonToRemoveState.textContent = "削除";

                            buttonToRemoveState.addEventListener(
                                'click',
                                async () => {
                                    const operation = new StateOperationToRemove();
                                    operation.targets.stateId = state.id;

                                    await sendStateCommand(operation.buildCommand());
                                }
                            );

                            stateControllerNode.appendChild(buttonToRemoveState);
                        }

                        const handle = openManipulatorNode(stateControllerNode, dd);
                        handle.onClosed = () => dd.classList.remove('state-selected');
                    }
                );

                return dd;
            })(state);

        if (stateNode.parentNode == null) {
            unitNode.appendChild(stateNode);
        }

        stateCount++;
    }

    return {stateCount};
}

class StateIconSettings {
    #category = '';

    /** @var {string|null} */
    #direction = null;

    /** @var {Function|null} */
    #onUpdated;

    /**
     * @param {string} value
     */
    set category(value) {
        this.#category = value.trim();
        this.#onUpdated?.call(null);
    }

    /**
     * @param {string|null} value
     */
    set direction(value) {
        this.#direction = value != null && value.trim() !== '' ? value.trim() : null;
        this.#onUpdated?.call(null);
    }

    get isValid() {
        return this.#category !== '';
    }

    /**
     * @return {string}
     */
    serialize() {
        return `${this.#category}:${this.#direction ?? ''}`;
    }

    /**
     * @return {string|null}
     */
    findErrorMessage() {
        if (this.#category === '') {
            return "アイコン系統を選択してください";
        }

        return null;
    }

    /**
     * @param {Function} value
     */
    set onUpdated(value) {
        this.#onUpdated = value;
    }
}

class StateAdditionalFields {
    /** @var {Object<string, string>} */
    #items = {};

    /** @var {Function} */
    #onUpdated;

    /**
     * @param {Function} onUpdated
     */
    constructor(onUpdated) {
        this.#onUpdated = onUpdated;
    }

    /**
     * @return {string[]}
     */
    get keys() {
        return Object.keys(this.#items);
    }

    /**
     * @param {string} key
     * @param {string} value
     */
    set(key, value) {
        this.#items[key] = value?.toString() ?? '';
        this.#onUpdated.call(null);
    }

    /**
     * @param {string} key
     */
    remove(key) {
        if (key in this.#items) {
            delete this.#items[key];
            this.#onUpdated.call(null);
        }
    }

    /**
     * @param {string} key
     * @return {string}
     */
    get(key) {
        return this.#items[key] ?? '';
    }
}

class StateOperation {
    /**
     * @return {boolean}
     */
    get isValid() {
        return false;
    }

    /**
     * @return {string}
     */
    buildCommand() {
        return '';
    }

    /**
     * @return {string|null}
     */
    findErrorMessage() {
        return "Not implemented";
    }
}

class StateOperationToAdd extends StateOperation {
    #stateName = '';

    #stateIcon = new StateIconSettings();

    /** @var {string|null} */
    #stateSource;

    /** @var {GameDuration|null} */
    #stateDuration = null;

    /** @var {string|null} */
    #stateDescription;

    /** @var {string[]} */
    #targets = [];

    /** @var {StateAdditionalFields} */
    #additionalFields;

    /** @var {Function|null} */
    #onUpdated = null;

    constructor() {
        super();

        this.#stateIcon.onUpdated = () => this.#onUpdated?.call(null);
        this.#additionalFields = new StateAdditionalFields(() => this.#onUpdated?.call(null));
    }

    /**
     * @param {string} value
     */
    set stateName(value) {
        this.#stateName = value.trim();
        this.#onUpdated?.call(null);
    }

    get stateIcon() {
        return this.#stateIcon;
    }

    /**
     * @param {string|null} value
     */
    set stateSource(value) {
        this.#stateSource = value != null && value.trim() !== '' ? value.trim() : null;
        this.#onUpdated?.call(null);
    }

    /**
     * @param {string} value
     */
    set stateDuration(value) {
        this.#stateDuration = GameDuration.canParse(value.trim())
            ? GameDuration.parse(value.trim())
            : null;
        this.#onUpdated?.call(null);
    }

    /**
     * @param {string|null} value
     */
    set stateDescription(value) {
        this.#stateDescription = value != null && value.trim() !== '' ? value.trim() : null;
        this.#onUpdated?.call(null);
    }

    /**
     * @param {string[]} value
     */
    set targets(value) {
        this.#targets = value.filter(x => x !== '');
        this.#onUpdated?.call(null);
    }

    /**
     * @return {StateAdditionalFields}
     */
    get additionalFields() {
        return this.#additionalFields;
    }

    /**
     * @return {boolean}
     */
    get isValid() {
        return this.findErrorMessage() == null;
    }

    buildCommand() {
        const parts = [
            `name=${this.#stateName}`,
            `duration=${this.#stateDuration?.toString() ?? ''}`,
            `icon=${this.#stateIcon.serialize()}`,
        ];

        if (this.#stateSource != null && this.#stateSource !== '') {
            parts.push(`source=${this.#stateSource}`);
        }

        if (this.#stateDescription != null && this.#stateDescription !== '') {
            parts.push(`description=${this.#stateDescription.replaceAll(/\n|\r|\r\n/g, '<br>')}`);
        }

        this.#additionalFields.keys.forEach(
            key => parts.push(`+${key}=${this.#additionalFields.get(key)}`)
        );

        const commandBase = `/state-add ${parts.map(x => `{${x}}`).join(' ')}`;

        if (this.#targets.length === 0) {
            return commandBase;
        }

        return `${commandBase} if ${this.#targets.map(x => `unit:${x}`).join(' | ')}`;
    }

    findErrorMessage() {
        if (this.#stateName === '') {
            return "状態名を入力してください";
        }

        if (!this.#stateIcon.isValid) {
            return this.#stateIcon.findErrorMessage();
        }

        if (this.#stateDuration == null) {
            return "持続時間を入力してください";
        } else if (this.#stateDuration.number != null && this.#stateDuration.number <= 0) {
            return "持続時間は 0 より大きな値を入力してください";
        }

        if (this.#targets.length === 0) {
            return "対象ユニットを１体以上選択してください";
        }

        return null;
    }

    /**
     * @param {Function} value
     */
    set onUpdated(value) {
        this.#onUpdated = value;
    }
}

class StateModificationSettings_Duration {
    /** @var {string|null} */
    #mode = null;

    #value = '';

    /** @var {Function|null} */
    #onUpdated = null;

    /**
     * @param {string} value
     */
    set mode(value) {
        this.#mode = value != null && value.trim() !== '' ? value.trim() : value;
        this.#onUpdated?.call(null);
    }

    /**
     * @param {string} value
     */
    set value(value) {
        this.#value = value.trim();
        this.#onUpdated?.call(null);
    }

    /**
     * @return {string|null}
     */
    findErrorMessage() {
        if (this.#mode == null) {
            return "減少／増加／代入のいずれかを選択してください";
        }

        if (!['decrement', 'increment', 'assignment'].includes(this.#mode)) {
            return `Unexpected mode: ${this.#mode}`;
        }

        if (!GameDuration.canParse(this.#value)) {
            let valueName;

            switch (this.#mode) {
                case 'decrement':
                    valueName = "減少させる量";
                    break;
                case 'increment':
                    valueName = "増加させる量";
                    break;
                case 'assignment':
                    valueName = "値";
                    break;
            }

            return `持続時間の${valueName}を入力してください`;
        }

        return null;
    }

    /**
     * @return {string|null}
     */
    buildCommandPart() {
        let operator;

        switch (this.#mode ?? '') {
            case 'decrement':
                operator = '-=';
                break;
            case 'increment':
                operator = '+=';
                break;
            case 'assignment':
                operator = '=';
                break;
            default:
                return null;
        }

        return `duration${operator}${this.#value?.toString() ?? ''}`;
    }

    /**
     * @param {Function} value
     */
    set onUpdated(value) {
        this.#onUpdated = value;
    }
}

class StateModificationSettings_TargetFilter {
    /** @var {string|null} */
    #stateId = null;

    /** @var {string|null} */
    #stateName = null;

    /** @var {string|null} */
    #sourceName = null;

    /** @var {string|null} */
    #holderUnitName = null;

    /** @var {string|null} */
    #durationUnit = null;

    /** @var {int} */
    #expectedCount = 0;

    /** @var {Function|null} */
    #onUpdated = null;

    /**
     * @param {string} value
     */
    set stateId(value) {
        this.#stateId = value != null && value.trim() !== '' ? value.trim() : null;
        this.#onUpdated?.call(null);
    }

    /**
     * @param {string} value
     */
    set stateName(value) {
        this.#stateName = value != null && value.trim() !== '' ? value.trim() : null;
        this.#onUpdated?.call(null);
    }

    /**
     * @param {string} value
     */
    set sourceName(value) {
        this.#sourceName = value != null && value.trim() !== '' ? value.trim() : null;
        this.#onUpdated?.call(null);
    }

    /**
     * @param {string} value
     */
    set holderUnitName(value) {
        this.#holderUnitName = value != null && value.trim() !== '' ? value.trim() : null;
        this.#onUpdated?.call(null);
    }

    /**
     * @param {string} value
     */
    set durationUnit(value) {
        this.#durationUnit = value != null && value.trim() !== '' ? value.trim() : null;
        this.#onUpdated?.call(null);
    }

    /**
     * @param {int} value
     */
    set expectedCount(value) {
        this.#expectedCount = value;
        this.#onUpdated?.call(null);
    }

    buildCommandPart() {
        const parts = [];

        if (this.#stateId != null) {
            parts.push(`{id:${this.#stateId}}`);
        } else {
            if (this.#stateName != null) {
                parts.push(`{name:${this.#stateName}}`);
            }

            if (this.#sourceName != null) {
                parts.push(`{source:${this.#sourceName}}`);
            }

            if (this.#holderUnitName != null) {
                parts.push(`{unit:${this.#holderUnitName}}`);
            }

            if (this.#durationUnit != null) {
                parts.push(`{durationUnit:${this.#durationUnit}}`);
            }
        }

        return parts.join(' ');
    }

    findErrorMessage() {
        if (
            this.#stateId == null &&
            this.#stateName == null &&
            this.#sourceName == null &&
            this.#holderUnitName == null &&
            this.#durationUnit == null
        ) {
            return "状態名・状態の発生源・状態の保有者・時間の単位のすくなくともひとつを指定してください";
        }

        if (this.#expectedCount === 0) {
            return "該当する状態が存在しません";
        }

        return null;
    }

    /**
     * @param {Function} value
     */
    set onUpdated(value) {
        this.#onUpdated = value;
    }
}

class StateModificationOperationBase extends StateOperation {
    #targets = new StateModificationSettings_TargetFilter();

    /** @var {Function|null} */
    #onUpdated = null;

    constructor() {
        super();

        this.#targets.onUpdated = () => this.#onUpdated?.call(null);
    }

    get targets() {
        return this.#targets;
    }

    get isValid() {
        return this.findErrorMessage() == null;
    }

    /**
     * @return {string|null}
     */
    findErrorMessage() {
        return this.#targets.findErrorMessage();
    }

    /**
     * @param {Function} value
     */
    set onUpdated(value) {
        this.#onUpdated = value;
    }

    /**
     * @protected
     */
    get _onUpdated() {
        return this.#onUpdated;
    }
}

class StateOperationToModify extends StateModificationOperationBase {
    #duration = new StateModificationSettings_Duration();

    constructor() {
        super();

        this.#duration.onUpdated = () => this._onUpdated?.call(null);
    }

    get duration() {
        return this.#duration;
    }

    /**
     * @return {string}
     */
    buildCommand() {
        return [
            `/state-modify ${this.#duration.buildCommandPart() ?? ''}`.trim(),
            this.targets.buildCommandPart(),
        ]
            .filter(x => x !== '')
            .join(' if ');
    }

    /**
     * @return {string|null}
     */
    findErrorMessage() {
        return super.findErrorMessage() ?? this.#duration.findErrorMessage();
    }
}

class StateOperationToRemove extends StateModificationOperationBase {
    /**
     * @return {string}
     */
    buildCommand() {
        return [
            '/state-remove',
            this.targets.buildCommandPart(),
        ]
            .filter(x => x !== '')
            .join(' if ');
    }

    /**
     * @return {string|null}
     */
    findErrorMessage() {
        return this.targets.findErrorMessage();
    }
}

class CompositeStateOperation extends StateOperation {
    /** @var {Object<string, StateOperation>} */
    #operations = {};

    #mode = '';

    /** @var {Function|null} */
    #onUpdated = null;

    /**
     * @param {Object<string, StateOperation>} operations
     */
    constructor(operations) {
        super();

        for (const [mode, operation] of Object.entries(operations)) {
            this.#operations[mode] = operation;
        }
    }

    /**
     * @param {string} value
     */
    set mode(value) {
        this.#mode = value;

        for (const operation of Object.values(this.#operations)) {
            operation.onUpdated = null;
        }

        if (this.#operations[this.#mode] != null) {
            this.#operations[this.#mode].onUpdated = () => this.#onUpdated?.call(null);
        }

        this.#onUpdated?.call(null);
    }

    get isValid() {
        return this.findErrorMessage() == null;
    }

    /**
     * @return {string}
     */
    buildCommand() {
        return this.#operations[this.#mode]?.buildCommand() ?? '';
    }

    /**
     * @return {string|null}
     */
    findErrorMessage() {
        if (this.#operations[this.#mode] == null) {
            return "操作モードを選択してください";
        }

        return this.#operations[this.#mode].findErrorMessage();
    }

    /** @var {Function} */
    set onUpdated(value) {
        this.#onUpdated = value;
    }
}

/**
 * @param {string} command
 */
async function sendStateCommand(command) {
    const id = `command-${randomId(20)}`;

    const temporaryNode = document.createElement('textarea');
    temporaryNode.setAttribute('id', id);
    temporaryNode.style.display = 'none';
    temporaryNode.value = command;

    document.querySelector('body').append(temporaryNode);

    await formSubmit(id);

    temporaryNode.remove();
}

(() => {
    const idOfWindow = 'unit-state-window';

    {
        const menuItemNode = document.getElementById('menu-button-unit-state');

        menuItemNode.querySelector('a').setAttribute('onclick', `boxOpen('${idOfWindow}');`);
        menuItemNode.style.display = 'initial';
    }

    /**
     * @return {HTMLDivElement}
     */
    function createWindow() {
        const window = document.createElement('div');
        window.classList.add('unit-state-window', 'float-box');
        window.setAttribute('id', idOfWindow);
        window.innerHTML = `
                  <h2>ユニット状態</h2>
                  <div class="window-content-area" data-selected-operation="">
                    <div class="panes">
                        <div class="operation-selector-area">
                            <label>
                                <input type="radio" name="state-operation" value="add" />
                                新しい状態を追加
                            </label>
                            <label>
                                <input type="radio" name="state-operation" value="modify" />
                                既存の状態を変更
                            </label>
                        </div>
                        <div class="state-settings-area">
                            <h3>状態設定</h3>
                            <button class="to-reset">状態設定を初期化</button>
                            <button class="to-select-template">テンプレートから選択</button>
                            <label for="state-name-settings">状態名</label>
                            <input id="state-name-settings" type="text" placeholder="ex) エンチャント・ウェポン" data-default-value="" />
                            <label for="state-icon-settings">アイコン系統</label>
                            <select id="state-icon-settings" data-default-value="汎用">
                                <option selected>汎用</option>
                                <optgroup label="SW2.5">
                                    <option value="SW2/真語魔法">真語魔法</option>
                                    <option value="SW2/操霊魔法">操霊魔法</option>
                                    <option value="SW2/深智魔法">深智魔法</option>
                                    <option value="SW2/神聖魔法">神聖魔法</option>
                                    <option value="SW2/魔動機術">魔動機術</option>
                                    <option value="SW2/妖精魔法">妖精魔法</option>
                                    <option value="SW2/森羅魔法">森羅魔法</option>
                                    <option value="SW2/召異魔法">召異魔法</option>
                                    <option value="SW2/奈落魔法">奈落魔法</option>
                                    <option value="SW2/練技">練技</option>
                                    <option value="SW2/呪歌">呪歌</option>
                                    <option value="SW2/騎芸">騎芸</option>
                                    <option value="SW2/賦術">賦術</option>
                                    <option value="SW2/相域">相域</option>
                                    <option value="SW2/鼓咆">鼓咆</option>
                                    <option value="SW2/陣率">陣率</option>
                                </optgroup>
                            </select>
                            <span class="label icon-direction">アイコン属性</span>
                            <div class="controls icon-direction radio-button-group">
                                <label>
                                    <input type="radio" name="unit-state-icon-direction" value="buff">
                                    バフ(有利な効果)
                                </label>
                                <label>
                                    <input type="radio" name="unit-state-icon-direction" value="debuff">
                                    デバフ(不利な効果)
                                </label>
                                <label>
                                    <input type="radio" name="unit-state-icon-direction" value="other">
                                    その他
                                </label>
                            </div>
                            <label for="state-source-settings">発生源</label>
                            <select id="state-source-settings" data-default-value=""></select>
                            <label for="state-duration-settings">持続時間</label>
                            <input id="state-duration-settings" type="text" placeholder="ex) 18R" data-default-value="" list="state-duration-settings-datalist" />
                            <datalist id="state-duration-settings-datalist"></datalist>
                            <div class="additional-fields">
                            </div>
                            <label for="state-description-settings">効果</label>
                            <textarea id="state-description-settings" data-default-value=""></textarea>
                        </div>
                        <div class="target-selector-area">
                            <div class="unit-selector-area">
                                <h3>対象ユニット選択</h3>
                                <div class="buttons">
                                    <button class="quick-select to-select-all-unit">すべてのユニットを選択</button>
                                    <button class="quick-select to-deselect-all-unit">すべての選択を解除</button>
                                </div>
                                <ul class="unit-list"></ul>
                            </div>
                            <div class="state-selector-area">
                                <h3>操作する状態の選択</h3>
                                <div class="filter-area">
                                    <label for="state-modification-target-by-state-name">状態名</label>
                                    <select id="state-modification-target-by-state-name"></select>
                                    <label for="state-modification-target-by-source">状態の発生源</label>
                                    <select id="state-modification-target-by-source"></select>
                                    <label for="state-modification-target-by-holder">状態の保有者</label>
                                    <select id="state-modification-target-by-holder"></select>
                                    <label for="state-modification-target-by-duration-unit">時間の単位</label>
                                    <select id="state-modification-target-by-duration-unit"></select>
                                </div>
                                <h4 class="headline-for-target-list">上記指定にもとづく操作対象</h4>
                                <ul class="target-list"></ul>
                            </div>
                        </div>
                        <div class="state-editor-area">
                            <h3>変更内容</h3>
                            <div class="duration-editor">
                                <h4>持続時間の変更</h4>
                                <div class="mode-selector">
                                    <label class="decrement">
                                        <input type="radio" name="duration-edit-mode" value="decrement" />
                                        減少
                                    </label>
                                    <label class="increment">
                                        <input type="radio" name="duration-edit-mode" value="increment" />
                                        増加
                                    </label>
                                    <label class="assignment">
                                        <input type="radio" name="duration-edit-mode" value="assignment" />
                                        代入(上書き)
                                    </label>
                                </div>
                                <label class="value-settings" data-mode="decrement">
                                    <span class="label">減少量</span>
                                    <input class="value" type="text" placeholder="ex) 1R" list="state-duration-offset-datalist" />
                                </label>
                                <label class="value-settings" data-mode="increment">
                                    <span class="label">増加量</span>
                                    <input class="value" type="text" placeholder="ex) 1R" list="state-duration-offset-datalist" />
                                </label>
                                <label class="value-settings" data-mode="assignment">
                                    <span class="label">代入する値</span>
                                    <input class="value" type="text" placeholder="ex) 18R" list="state-duration-settings-datalist" />
                                </label>
                                <datalist id="state-duration-offset-datalist"></datalist>
                            </div>
                        </div>
                        <div class="command-area">
                            <span class="label-for-command">実行予定コマンド</span>
                            <textarea readonly class="command-display"></textarea>
                            <div class="buttons">
                                <button class="to-copy">コピー</button>
                                <button class="to-execute" disabled>実行</button>
                            </div>
                            <div class="error-message"></div>
                        </div>
                    </div>
                  </div>
                  <span class="close button" onclick="boxClose('${idOfWindow}');">×</span>
                `;

        document.querySelector('body').appendChild(window);

        makeDraggable(window.querySelector('h2'));

        return window;
    }

    const operationToAdd = new StateOperationToAdd();
    const operationToModify = new StateOperationToModify();
    const operations = new CompositeStateOperation(
        {
            add: operationToAdd,
            modify: operationToModify
        }
    );

    const window = createWindow();

    /**
     * @param {HTMLSelectElement|HTMLInputElement|HTMLTextAreaElement|HTMLElement} control
     * @param {string} value
     */
    function setValue(control, value) {
        if (control instanceof HTMLSelectElement) {
            for (let i = 0; i < control.options.length; i++) {
                const option = control.options[i];

                if (option.value === value) {
                    control.selectedIndex = i;
                    control.dispatchEvent(new Event('change'));
                    return;
                }
            }

            console.warn(`Option '${value}' is not found.`);
        } else if (control instanceof HTMLInputElement) {
            if (control.getAttribute('type') === 'text') {
                control.value = value;
                control.dispatchEvent(new Event('change'));
            } else {
                console.error(`Unexpected type INPUT element: ${control.getAttribute('type')}`);
            }
        } else if (control instanceof HTMLTextAreaElement) {
            control.value = value;
            control.dispatchEvent(new Event('change'));
        } else {
            control.querySelectorAll('input[type="radio"]').forEach(x => x.checked = false);

            const radioButton = control.querySelector(`input[type="radio"][value="${value}"]`);

            if (radioButton != null) {
                radioButton.checked = true;
                radioButton.dispatchEvent(new Event('change'));
            } else if (value === '') {
                const radioButtons = control.querySelectorAll(`input[type="radio"]`);
                radioButtons.forEach(x => x.checked = false);
                radioButtons.forEach(x => x.dispatchEvent(new Event('change')));
            } else {
                console.warn(`Option '${value}' is not found.`);
            }
        }
    }

    {
        const commandDisplayTextarea = window.querySelector('.command-display');

        commandDisplayTextarea.addEventListener(
            'change',
            () => {
                commandDisplayTextarea.style.height = 'auto';
                commandDisplayTextarea.style.height = `calc(${commandDisplayTextarea.scrollHeight}px + (0.1rem * 2))`;
            }
        );
    }

    {
        const buttonToCopy = window.querySelector('.command-area button.to-copy');

        buttonToCopy.addEventListener(
            'click',
            async () => {
                const textarea = window.querySelector('.command-display');

                if (textarea.value === '') {
                    return;
                }

                await navigator.clipboard.writeText(textarea.value);
            }
        );
    }

    {
        const buttonToExecute = window.querySelector('.command-area button.to-execute');

        buttonToExecute.addEventListener(
            'click',
            async () => {
                if (buttonToExecute.hasAttribute('disabled')) {
                    return;
                }

                const commandDisplay = window.querySelector('.command-area .command-display');

                await sendStateCommand(commandDisplay.value);
            }
        );
    }

    {
        const nameInput = window.querySelector('#state-name-settings');
        const iconCategorySelector = window.querySelector('#state-icon-settings');
        const iconDirectionSelectArea = window.querySelector('.icon-direction.radio-button-group');
        const sourceSelector = window.querySelector('#state-source-settings');
        const durationInput = window.querySelector('#state-duration-settings');
        const descriptionTextarea = window.querySelector('#state-description-settings');

        {
            const onUpdated = () => operationToAdd.stateName = nameInput.value;

            nameInput.addEventListener('input', onUpdated);
            nameInput.addEventListener('change', onUpdated);
            nameInput.dispatchEvent(new Event('change'));
        }

        {
            const onUpdated = () => operationToAdd.stateIcon.category = iconCategorySelector.value;

            iconCategorySelector.addEventListener('input', onUpdated);
            iconCategorySelector.addEventListener('change', onUpdated);
            iconCategorySelector.dispatchEvent(new Event('change'));
        }

        {
            iconDirectionSelectArea.querySelectorAll('[name="unit-state-icon-direction"]').forEach(
                radioButton => {
                    const onUpdated = () => {
                        if (radioButton.checked) {
                            operationToAdd.stateIcon.direction = radioButton.value;
                        } else {
                            const radioButtons =
                                radioButton.closest('.radio-button-group').querySelectorAll('input[type="radio"]');

                            if ([...radioButtons].every(x => !x.checked)) {
                                operationToAdd.stateIcon.direction = null;
                            }
                        }
                    };

                    radioButton.addEventListener('input', onUpdated);
                    radioButton.addEventListener('change', onUpdated);
                    radioButton.dispatchEvent(new Event('change'));
                }
            );
        }

        {
            const onUpdated = () => operationToAdd.stateSource = sourceSelector.value;

            sourceSelector.addEventListener('input', onUpdated);
            sourceSelector.addEventListener('change', onUpdated);
            sourceSelector.dispatchEvent(new Event('change'));
        }

        {
            const onUpdated = () => operationToAdd.stateDuration = durationInput.value;

            durationInput.addEventListener('input', onUpdated);
            durationInput.addEventListener('change', onUpdated);
            durationInput.dispatchEvent(new Event('change'));

            {
                const assignmentDatalist = document.getElementById('state-duration-settings-datalist');
                const offsetDatalist = document.getElementById('state-duration-offset-datalist');

                switch (gameCode) {
                    case 'sw2':
                        for (const value of ['1R', '3R', '6R', '18R', '10分', '1時間', '3時間', '6時間', '1日', '永続', '特殊']) {
                            const option = document.createElement('option');
                            option.textContent = value;
                            assignmentDatalist.appendChild(option);
                        }
                        for (const value of ['1R', '18R', '10分', '1時間', '6時間', '1日']) {
                            const option = document.createElement('option');
                            option.textContent = value;
                            offsetDatalist.appendChild(option);
                        }
                        break;
                }
            }
        }

        switch (gameCode) {
            case 'sw2': {
                const label = document.createElement('label');
                label.textContent = "達成値";
                label.dataset.label = "達成値";

                const input = document.createElement('input');
                input.setAttribute('type', 'text');
                input.setAttribute('name', '達成値');

                window.querySelector('.state-settings-area > .additional-fields').append(
                    label,
                    input
                );
            }
                break;
        }

        window.querySelectorAll('.state-settings-area > .additional-fields input').forEach(
            control => {
                const fieldName = control.getAttribute('name');

                const onUpdated = () => {
                    const value = control.value?.toString().trim() ?? '';

                    if (value !== '') {
                        operationToAdd.additionalFields.set(fieldName, value);
                    } else {
                        operationToAdd.additionalFields.remove(fieldName);
                    }
                };

                control.addEventListener('input', onUpdated);
                control.addEventListener('change', onUpdated);
                control.dispatchEvent(new Event('change'));
            }
        );

        {
            const onUpdated = () => operationToAdd.stateDescription = descriptionTextarea.value

            descriptionTextarea.addEventListener('input', onUpdated);
            descriptionTextarea.addEventListener('change', onUpdated);
        }

        {
            const templateDialog = document.createElement('dialog');
            templateDialog.classList.add('state-template-selector', 'box', 'modal');
            templateDialog.addEventListener('close', () => templateDialog.close());
            templateDialog.addEventListener(
                'click',
                (e) => {
                    const rect = templateDialog.getBoundingClientRect();

                    const inDialog =
                        rect.top <= e.clientY &&
                        e.clientY <= rect.top + rect.height &&
                        rect.left <= e.clientX &&
                        e.clientX <= rect.left + rect.width;

                    if (!inDialog) {
                        templateDialog.dispatchEvent(new Event('close'));
                    }
                }
            );

            {
                const templateContainer = document.createElement('div');
                templateContainer.classList.add('template-container');

                /**
                 * @param {HTMLElement[]} nodes
                 * @param {UnitContinuationState} state
                 */
                function setupTemplateEventListeners(nodes, state) {
                    nodes.forEach(
                        node => {
                            node.addEventListener(
                                'mouseenter',
                                () => nodes.forEach(
                                    x => x.classList.add('highlight')
                                )
                            );

                            node.addEventListener(
                                'mouseleave',
                                () => nodes.forEach(
                                    x => x.classList.remove('highlight')
                                )
                            );

                            node.addEventListener(
                                'click',
                                () => {
                                    window.querySelectorAll('.state-settings-area .additional-fields input').forEach(
                                        x => setValue(x, '')
                                    );

                                    setValue(nameInput, state.name);
                                    setValue(iconCategorySelector, state.icon?.category ?? '');
                                    setValue(iconDirectionSelectArea, state.icon?.direction ?? '');
                                    setValue(durationInput, state.duration?.toString() ?? '');
                                    setValue(sourceSelector, state.source ?? '');
                                    setValue(descriptionTextarea, state.description ?? '');

                                    templateDialog.dispatchEvent(new Event('close'));
                                }
                            );
                        }
                    );
                }

                /**
                 * @return {HTMLElement[]}
                 */
                function createStateListHeaders() {
                    function createHeader(klass, text) {
                        const node = document.createElement('span');
                        node.classList.add('header', klass);
                        node.textContent = text;
                        return node;
                    }

                    return [
                        createHeader('state-name', "名称"),
                        createHeader('state-duration', "持続"),
                        createHeader('state-description', "効果"),
                    ];
                }

                const recentMentionedStateContainer = document.createElement('details');

                {
                    recentMentionedStateContainer.classList.add('recent');
                    recentMentionedStateContainer.setAttribute('open', '');
                    templateContainer.appendChild(recentMentionedStateContainer);

                    const summary = document.createElement('summary');
                    summary.textContent = "直近で言及されたもの";
                    recentMentionedStateContainer.appendChild(summary);

                    const stateContainer = document.createElement('div');
                    stateContainer.classList.add('states');
                    stateContainer.append(...createStateListHeaders());
                    recentMentionedStateContainer.appendChild(stateContainer);
                }

                /** @var {UnitContinuationState[]} */
                const dummyStates = [];

                function refreshRecentMentionedTemplateList() {
                    const recentMessageList = [];

                    document.querySelectorAll('.chat.view').forEach(
                        chatView =>
                            chatView.querySelectorAll('.logs > dl:nth-last-child(-n+40)').forEach(
                                dl => dl.querySelectorAll('.comm').forEach(
                                    comm => recentMessageList.push(comm.textContent.trim())
                                )
                            )
                    );

                    /**
                     * よくある表記の紛れを吸収する.
                     * @param {string} source
                     * @return {string}
                     */
                    function normalizeStateName(source) {
                        let normalized = source;

                        /** @var {{source: string, destination: string}[]} */
                        const replacements = [
                            {source: 'ァ', destination: 'ア'},
                            {source: 'ィ', destination: 'イ'},
                            {source: 'ゥ', destination: 'ウ'},
                            {source: 'ェ', destination: 'エ'},
                            {source: 'ォ', destination: 'オ'},
                        ];

                        for (const replacement of replacements) {
                            normalized = normalized.replaceAll(replacement.source, replacement.destination);
                        }

                        return normalized;
                    }

                    const combinedRecentMessages = normalizeStateName(recentMessageList.join('\n'));

                    /** @var {Array<UnitContinuationState>} */
                    const mentionedTemplates = [];

                    /**
                     * @param {string} name
                     * @return {Generator<string>}
                     */
                    function* enumerateStateNamePart(name) {
                        for (const re of [/〈(.+?)〉/, /《(.+?)》/, /【(.+?)】/, /「(.+?)」/]) {
                            const m = name.match(re);

                            if (m != null) {
                                yield m[1];
                            }
                        }

                        yield name;
                    }

                    dummyStates.forEach(
                        state => {
                            for (const part of enumerateStateNamePart(normalizeStateName(state.name))) {
                                if (!combinedRecentMessages.includes(part)) {
                                    continue;
                                }

                                mentionedTemplates.push(state);
                                break;
                            }
                        }
                    );

                    recentMentionedStateContainer.querySelectorAll('.states > .recent-item').forEach(x => x.remove());

                    mentionedTemplates.forEach(
                        state => {
                            const nodes =
                                [...templateContainer.querySelectorAll(`.game .category .states [data-state-name="${state.name}"]`)].map(
                                    x => {
                                        /** @var {HTMLElement} */
                                        const cloned = x.cloneNode(true);
                                        cloned.classList.add('recent-item');

                                        return cloned;
                                    }
                                );

                            setupTemplateEventListeners(nodes, state);

                            recentMentionedStateContainer.querySelector('.states').append(...nodes);
                        }
                    );
                }

                stateTemplates.forEach(
                    game => {
                        const gameNode = document.createElement('details');
                        gameNode.classList.add('game');
                        gameNode.setAttribute('open', '');
                        gameNode.dataset.gameName = game.gameName;

                        const summary = document.createElement('summary');
                        summary.textContent = game.gameName;
                        gameNode.appendChild(summary);

                        const categoryContainer = document.createElement('div');
                        categoryContainer.classList.add('categories');
                        gameNode.appendChild(categoryContainer);

                        game.categories.forEach(
                            category => {
                                const categoryNode = document.createElement('details');
                                categoryNode.classList.add('category');
                                categoryNode.setAttribute('open', '');
                                categoryNode.dataset.categoryName = category.categoryName;

                                const summary = document.createElement('summary');
                                summary.textContent = category.categoryName;
                                categoryNode.appendChild(summary);

                                const stateContainer = document.createElement('div');
                                stateContainer.classList.add('states');
                                categoryNode.appendChild(stateContainer);

                                stateContainer.append(...createStateListHeaders());

                                category.states.forEach(
                                    stateSettings => {
                                        const dummyState = new UnitContinuationState(
                                            '',
                                            stateSettings.name,
                                            stateSettings.duration ?? GameDuration.NaN,
                                            null,
                                            stateSettings.source ?? null,
                                            stateSettings.icon,
                                            {},
                                            stateSettings.description?.replaceAll('\\n', '\n')
                                        );

                                        const nodes = [
                                            createUnitStateIconNode(dummyState),
                                            createUnitStateNameNode(dummyState),
                                            createUnitStateDurationNode(dummyState),
                                            createUnitStateDescriptionNode(dummyState),
                                        ];

                                        nodes.forEach(
                                            node => {
                                                stateContainer.appendChild(node);

                                                if (dummyState.description != null && dummyState.description !== '') {
                                                    node.setAttribute('title', dummyState.description);
                                                }
                                            }
                                        );

                                        setupTemplateEventListeners(nodes, dummyState);

                                        dummyStates.push(dummyState);
                                    }
                                );

                                categoryContainer.appendChild(categoryNode);
                            }
                        );

                        templateContainer.appendChild(gameNode);
                    }
                );

                templateDialog.appendChild(templateContainer);
            }

            document.querySelector('body').appendChild(templateDialog);

            {
                const buttonToSelectTemplate =
                    window.querySelector('.state-settings-area button.to-select-template');

                buttonToSelectTemplate.addEventListener(
                    'click',
                    () => {
                        refreshRecentMentionedTemplateList();
                        templateDialog.showModal();
                    }
                );
                buttonToSelectTemplate.classList.toggle('hidden', stateTemplates.length === 0);
            }
        }
    }

    {
        /**
         * @param {string} text
         * @return {string}
         */
        function escape(text) {
            const dummy = document.createElement('span');
            dummy.textContent = text;
            return dummy.innerHTML;
        }

        /** @var {HTMLSelectElement} */
        const stateNameSelector =
            window.querySelector('#state-modification-target-by-state-name');

        /** @var {HTMLSelectElement} */
        const stateSourceSelector =
            window.querySelector('#state-modification-target-by-source');

        /** @var {HTMLSelectElement} */
        const stateHolderSelector =
            window.querySelector('#state-modification-target-by-holder');

        /** @var {HTMLSelectElement} */
        const stateDurationUnitSelector =
            window.querySelector('#state-modification-target-by-duration-unit');

        const onUpdated = () => {
            const selectedStateName = stateNameSelector.value.trim();
            const selectedSourceName = stateSourceSelector.value.trim();
            const selectedHolderName = stateHolderSelector.value.trim();
            const selectedDurationUnit = stateDurationUnitSelector.value.trim();

            operationToModify.targets.stateName = selectedStateName;
            operationToModify.targets.sourceName = selectedSourceName;
            operationToModify.targets.holderUnitName = selectedHolderName;
            operationToModify.targets.durationUnit = selectedDurationUnit;

            const stateSelectorArea =
                window.querySelector('.target-selector-area .state-selector-area');

            stateSelectorArea.dataset.selectedStateName = selectedStateName;
            stateSelectorArea.dataset.selectedSourceName = selectedSourceName;
            stateSelectorArea.dataset.selectedHolderName = selectedHolderName;
            stateSelectorArea.dataset.selectedDurationUnit = selectedDurationUnit;

            const targetList = stateSelectorArea.querySelector('.target-list');

            const classNameToSelect = 'selected';

            targetList.querySelectorAll(`.${classNameToSelect}`).forEach(
                x => x.classList.remove(classNameToSelect)
            );

            {
                let query = '.state';

                if (selectedStateName !== '') {
                    query += `[data-state-name="${escape(selectedStateName)}"]`;
                }

                if (selectedSourceName !== '') {
                    query += `[data-source-name="${escape(selectedSourceName)}"]`;
                }

                if (selectedHolderName !== '') {
                    query += `[data-holder-unit-name="${escape(selectedHolderName)}"]`;
                }

                if (selectedDurationUnit !== '') {
                    query += `[data-duration-unit="${escape(selectedDurationUnit)}"]`;
                }

                targetList.querySelectorAll(query).forEach(x => x.classList.add(classNameToSelect));
            }

            operationToModify.targets.expectedCount =
                targetList.querySelectorAll(`.${classNameToSelect}`).length;
        };

        stateNameSelector.addEventListener('input', onUpdated);
        stateNameSelector.addEventListener('change', onUpdated);

        stateSourceSelector.addEventListener('input', onUpdated);
        stateSourceSelector.addEventListener('change', onUpdated);

        stateHolderSelector.addEventListener('input', onUpdated);
        stateHolderSelector.addEventListener('change', onUpdated);

        stateDurationUnitSelector.addEventListener('input', onUpdated);
        stateDurationUnitSelector.addEventListener('change', onUpdated);

        onUpdated();
    }

    {
        const durationEditor = window.querySelector('.state-editor-area .duration-editor');

        function onValueChanged() {
            const mode = durationEditor.dataset.selectedMode;

            operationToModify.duration.value =
                durationEditor.querySelector(`.value-settings[data-mode="${mode}"] input.value`).value;
        }

        function selectMode(mode) {
            durationEditor.dataset.selectedMode = mode;
            operationToModify.duration.mode = mode;

            durationEditor.querySelectorAll('.value-settings[data-mode] input.value').forEach(
                x => {
                    x.removeEventListener('input', onValueChanged);
                    x.removeEventListener('change', onValueChanged);
                }
            );

            {
                const input = durationEditor.querySelector(`.value-settings[data-mode="${mode}"] input.value`);

                input.addEventListener('input', onValueChanged);
                input.addEventListener('change', onValueChanged);
            }
        }

        durationEditor.querySelectorAll('[name="duration-edit-mode"]').forEach(
            radioButton => {
                const onUpdated = () => {
                    if (radioButton.checked) {
                        selectMode(radioButton.value);
                    }
                };

                radioButton.addEventListener('input', onUpdated);
                radioButton.addEventListener('change', onUpdated);
            }
        );
    }

    {
        const commandDisplay = window.querySelector('.command-area .command-display');
        const buttonToExecuteCommand = window.querySelector('.command-area button.to-execute');
        const errorMessageContainer = window.querySelector('.command-area .error-message');

        operations.onUpdated = () => {
            if (operations.isValid) {
                buttonToExecuteCommand.removeAttribute('disabled');
                errorMessageContainer.textContent = '';
            } else {
                buttonToExecuteCommand.setAttribute('disabled', '');
                errorMessageContainer.textContent = operations.findErrorMessage();
            }

            commandDisplay.classList.toggle('has-error', !operations.isValid);
            commandDisplay.value = operations.buildCommand();
            commandDisplay.dispatchEvent(new Event('change'));
        };

        window.querySelectorAll('input[type="radio"][name="state-operation"]').forEach(
            radioButton => {
                const onUpdated = () => {
                    if (!radioButton.checked) {
                        return;
                    }

                    const selectedOperationName = radioButton.value;

                    window.querySelector('.window-content-area').dataset.selectedOperation = selectedOperationName;
                    operations.mode = selectedOperationName;
                };

                radioButton.addEventListener('input', () => onUpdated());
                radioButton.addEventListener('change', () => onUpdated());
                radioButton.dispatchEvent(new Event('change'));
            }
        );
    }

    {
        const button = window.querySelector('.state-settings-area > button.to-reset');

        button.addEventListener(
            'click',
            () => {
                const settingsArea = window.querySelector('.state-settings-area');

                settingsArea.querySelectorAll('[data-default-value]:not(.radio-button-group)').forEach(
                    x => {
                        x.value = x.dataset.defaultValue;
                        x.dispatchEvent(new Event('change'));
                    }
                );

                settingsArea.querySelectorAll('.radio-button-group').forEach(
                    radioButtonGroup => {
                        let defaultOption;

                        radioButtonGroup.querySelectorAll('input[type="radio"]').forEach(
                            x => {
                                x.checked = false;
                                x.dispatchEvent(new Event('change'));

                                if (x.value === radioButtonGroup.dataset.defaultValue) {
                                    defaultOption = x;
                                }
                            }
                        );

                        if (defaultOption != null) {
                            defaultOption.checked = true;
                            defaultOption.dispatchEvent(new Event('change'));
                        }
                    }
                );
            }
        );

        button.dispatchEvent(new Event('click'));
    }

    window.querySelectorAll('#state-name-settings, #state-duration-settings').forEach(
        input => {
            const onUpdated = () => input.dataset.value = input.value.trim();

            input.addEventListener('input', onUpdated);
            input.addEventListener('change', onUpdated);
            input.dispatchEvent(new Event('change'));
        }
    );

    {
        const unitListNode = window.querySelector('.unit-selector-area .unit-list');

        window.querySelector('button.to-select-all-unit').addEventListener(
            'click',
            () => unitListNode.querySelectorAll('input.checkbox-to-select-unit[type="checkbox"]').forEach(
                checkbox => {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change'));
                }
            )
        );

        window.querySelector('button.to-deselect-all-unit').addEventListener(
            'click',
            () => unitListNode.querySelectorAll('input.checkbox-to-select-unit[type="checkbox"]').forEach(
                checkbox => {
                    checkbox.checked = false;
                    checkbox.dispatchEvent(new Event('change'));
                }
            )
        );
    }

    const onUnitChanged = () => {
        updateUnitList(window, operationToAdd);
        onStateChanged();
    };

    const onStateChanged = () => {
        updateStateList(window);
    };

    document.querySelector('body').addEventListener('unit-added', onUnitChanged);
    document.querySelector('body').addEventListener('unit-removed', onUnitChanged);

    document.querySelector('body').addEventListener('state-added', onStateChanged);
    document.querySelector('body').addEventListener('state-modified', onStateChanged);

    window.addEventListener(
        'opening',
        () => {
            onUnitChanged();
            onStateChanged();
        }
    );
})();

function getUnitNamesFromStatusList() {
    const orderedUnitNames = [];

    document.querySelectorAll('#status-body > dl > .chara-name').forEach(
        x => orderedUnitNames.push(x.textContent.trim())
    );

    return orderedUnitNames;
}

/**
 * @param {HTMLElement} window
 * @param {StateOperationToAdd} operationToAdd
 */
function updateUnitList(window, operationToAdd) {
    const unitListNode = window.querySelector('.unit-selector-area .unit-list');

    const onUnitSelectionUpdated = () => {
        /** @var {string[]} */
        const selectedUnitNames = [];

        unitListNode.querySelectorAll('.checkbox-to-select-unit[data-unit-name]').forEach(
            checkbox => {
                if (checkbox.checked) {
                    selectedUnitNames.push(checkbox.dataset.unitName);
                }

                const parent = checkbox.parentNode;
                if (parent instanceof HTMLElement) {
                    parent.classList.toggle('selected', checkbox.checked);
                }
            }
        );

        operationToAdd.targets = selectedUnitNames;
    };

    const unitNodes = (unitListNode => {
        /** @var {Object.<string, HTMLLIElement>} */
        const o = {};

        unitListNode.querySelectorAll('li.unit[data-unit-id]').forEach(
            x => o[x.dataset.unitId] = x
        );

        return o;
    })(unitListNode);

    Object.values(unitNodes).forEach(x => x.remove());

    const orderedUnitNames = getUnitNamesFromStatusList();

    for (const unitName of orderedUnitNames) {
        const unit = unitList[unitName];

        if (unit == null) {
            continue;
        }

        const unitId = unit['id'];

        /** @var {HTMLLIElement} */
        const unitNode =
            unitNodes[unitId] ??
            ((unitId, unitName) => {
                const unitNode = document.createElement('li');
                unitNode.classList.add('unit');
                unitNode.dataset.unitId = unitId;

                const label = document.createElement('label');

                const checkboxId = `checkbox-${randomId(12)}`;

                const checkboxNode = document.createElement('input');
                checkboxNode.setAttribute('type', 'checkbox');
                checkboxNode.setAttribute('id', checkboxId);
                checkboxNode.classList.add('checkbox-to-select-unit');
                checkboxNode.dataset.unitName = unitName;
                checkboxNode.addEventListener('input', () => onUnitSelectionUpdated());
                checkboxNode.addEventListener('change', () => onUnitSelectionUpdated());
                label.appendChild(checkboxNode);

                const unitNameNode = document.createElement('span');
                unitNameNode.classList.add('unit-name');
                unitNameNode.textContent = unitName;
                label.appendChild(unitNameNode);

                const unitPropertiesNode = document.createElement('div');
                unitPropertiesNode.classList.add('unit-properties');
                label.appendChild(unitPropertiesNode);

                unitNode.appendChild(label);

                return unitNode;
            })(unitId, unitName);

        unitListNode.appendChild(unitNode);

        unitNode.querySelector('.unit-name').dataset.color = unit['color'];

        {
            const unitPropertiesNode = unitNode.querySelector('.unit-properties');
            unitPropertiesNode.innerHTML = '';

            /** @var {string[]} */
            const propertyNames = unitList[unitName]['sttnames'] ?? [];

            for (const propertyName of propertyNames.slice(0, 2)) {
                const propertyValue = unitList[unitName]['status'][propertyName];

                const propertyNode = document.createElement('span');
                propertyNode.classList.add('property');
                propertyNode.textContent = `${propertyName}:${propertyValue}`;

                unitPropertiesNode.appendChild(propertyNode);
            }
        }
    }

    {
        const selector = window.querySelector('#state-source-settings');

        const selectedValue = selector.value;

        selector.innerHTML = '';

        let index = 0;
        for (const unitName of ['', '#self'].concat(orderedUnitNames)) {
            const option = document.createElement('option');

            switch (unitName) {
                case '':
                    option.textContent = '（指定なし）';
                    option.setAttribute('value', '');
                    break;
                case '#self':
                    option.textContent = '［本人］';
                    option.setAttribute('value', '#self');
                    break;
                default:
                    option.textContent = unitName;
                    break;
            }

            selector.appendChild(option);

            if (unitName === selectedValue) {
                selector.selectedIndex = index;
            }

            index++;
        }
    }

    onUnitSelectionUpdated();
}

/**
 * @param {HTMLElement} window
 */
function updateStateList(window) {
    const unitNames = getUnitNamesFromStatusList();

    /** @var {Object<string, UnitContinuationState[]>} */
    const statesByUnitName = {};
    unitNames.forEach(x => statesByUnitName[x] = loadUnitStates(x));

    const states =
        Object.values(statesByUnitName)
            .map(states => states)
            .flat();

    {
        const targetList = window.querySelector('.state-selector-area .target-list');

        targetList.innerHTML = '';

        unitNames.forEach(
            unitName => {
                const unitNode = document.createElement('li');
                unitNode.classList.add('holder-unit');

                const unitNameNode = document.createElement('span');
                unitNameNode.classList.add('unit-name');
                unitNameNode.textContent = unitName;
                unitNode.appendChild(unitNameNode);

                const stateList = document.createElement('ul');
                stateList.classList.add('state-list');

                (statesByUnitName[unitName] ?? []).forEach(
                   /** @param {UnitContinuationState} state */ state => {
                       const stateNode = document.createElement('li');
                       stateNode.classList.add('state');
                       stateNode.dataset.holderUnitName = unitName;
                       stateNode.dataset.stateName = state.name;
                       stateNode.dataset.sourceName = state.source ?? '';
                       stateNode.dataset.durationUnit = state.duration.unit;
                       stateNode.appendChild(createUnitStateIconNode(state));
                       const nameNode = createUnitStateNameNode(state);
                       nameNode.setAttribute('title', state.name);
                       stateNode.appendChild(nameNode);
                       stateNode.appendChild(createUnitStateDurationNode(state));
                       stateNode.appendChild(createUnitStateSourceNode(state, unitName));

                       stateList.appendChild(stateNode);
                   }
                );

                unitNode.appendChild(stateList);

                targetList.appendChild(unitNode);
            }
        );
    }

    {
        const stateNames = [...new Set(states.map(x => x.name))].sort();

        const stateNameSelector = window.querySelector('#state-modification-target-by-state-name');
        const selectedStateName = stateNameSelector.value;
        stateNameSelector.innerHTML = '';

        [''].concat(stateNames).forEach(
            (stateName, i) => {
                const option = document.createElement('option');

                if (stateName !== '') {
                    option.textContent = stateName;
                } else {
                    option.setAttribute('value', stateName);
                    option.textContent = "（指定なし）";
                }

                stateNameSelector.appendChild(option);

                if (stateName === selectedStateName) {
                    stateNameSelector.selectedIndex = i;
                }
            }
        );

        stateNameSelector.dispatchEvent(new Event('change'));
    }

    {
        const stateSourceSelector = window.querySelector('#state-modification-target-by-source');
        const stateHolderSelector = window.querySelector('#state-modification-target-by-holder');

        const selectedSourceName = stateSourceSelector.value;
        const selectedHolderName = stateHolderSelector.value;

        stateSourceSelector.innerHTML = '';
        stateHolderSelector.innerHTML = '';

        [''].concat(unitNames).forEach(
            (unitName, i) => {
                const option = document.createElement('option');

                if (unitName !== '') {
                    option.textContent = unitName;
                } else {
                    option.setAttribute('value', unitName);
                    option.textContent = "（指定なし）";
                }

                stateSourceSelector.appendChild(option);
                stateHolderSelector.appendChild(option.cloneNode(true));

                if (unitName === selectedSourceName) {
                    stateSourceSelector.selectedIndex = i;
                }

                if (unitName === selectedHolderName) {
                    stateHolderSelector.selectedIndex = i;
                }
            }
        );

        stateSourceSelector.dispatchEvent(new Event('change'));
        stateHolderSelector.dispatchEvent(new Event('change'));
    }

    {
        const durationUnits =
            [...new Set(states.map(x => x.duration.unit).filter(x => x !== ''))].sort();

        const stateDurationUnitSelector =
            window.querySelector('#state-modification-target-by-duration-unit');

        const selectedDurationUnit = stateDurationUnitSelector.value;
        stateDurationUnitSelector.innerHTML = '';

        [''].concat(durationUnits).forEach(
            (durationUnit, i) => {
                const option = document.createElement('option');

                if (durationUnit !== '') {
                    option.textContent = durationUnit;
                } else {
                    option.setAttribute('value', durationUnit);
                    option.textContent = "（指定なし）";
                }

                stateDurationUnitSelector.appendChild(option);

                if (durationUnit === selectedDurationUnit) {
                    stateDurationUnitSelector.selectedIndex = i;
                }
            }
        );

        stateDurationUnitSelector.dispatchEvent(new Event('change'));
    }
}

/**
 * @param {Object<string, Array<{id: string, name: string, source: string, duration: {value?: int|null, unit?: string|null}, icon: {category: string, direction: string}, description?: string|null}>>} unitStates
 */
function updateGlobalUnitState(unitStates) {
    for (const [unitName, states] of Object.entries(unitStates)) {
        if (!(unitName in unitList)) {
            console.warn(`Unit "${unitName}" is not found.`);
            continue;
        }

        const unit = unitList[unitName];

        unit['states'] = states.slice();
    }
}
