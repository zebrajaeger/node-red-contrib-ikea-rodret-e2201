module.exports = function (RED) {
    function E2201(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.name = config.name;
        node.min = parseFloat(config.min);
        node.max = parseFloat(config.max);
        node.intervalMs = parseInt(config.intervalMs);
        node.step = parseInt(config.step);

        var timer = undefined;

        let ticks = 0;
        const tickMultiplicator1 = 3;
        const tickMultiplicator1Threshold = 20;
        const tickMultiplicator2 = 8;
        const tickMultiplicator2Threshold = 40;

        // initialize
        let x = this.context().get('level');
        if (x) {
            this.status({ fill: "yellow", shape: "dot", text: x });
        } else {
            this.status({ fill: "yellow", shape: "ring", text: '0' });
            this.context().set('level', 0);
        }

        this.on('oneditprepare', function (msg) {
            $("#node-input-example1").typedInput({
                type: "nuum",
                types: ["num"],
                typeField: "#node-input-example1-type"
            })
            $("#node-input-example2").typedInput({
                type: "nuum",
                types: ["num"],
                typeField: "#node-input-example2-type"
            })
        });

        this.on('input', function (msg) {
            // {"action":"off","battery":85,"linkquality":7,"update":{"state":"idle"}}
            // action: 'off', 'on', 'brightness_move_up', 'brightness_move_down', 'brightness_stop'
            const action = msg.payload.action;
            node.debug({ action });

            // no action -> no fun
            if (!action) {
                return;
            }

            if (action == 'on') {
                const level = node.max;
                this.status({ fill: "yellow", shape: "dot", text: level });
                this.context().set('level', level);
                node.send({ payload: level });
            }

            if (action == 'off') {
                const level = node.min;
                this.status({ fill: "yellow", shape: "ring", text: level });
                this.context().set('level', level);
                node.send({ payload: level });
            }

            if (action == 'brightness_move_up') {
                if (timer) {
                    clearInterval(timer);
                }
                ticks = 0;
                timer = setInterval(() => {
                    ++ticks;
                    let level = this.context().get('level') || 0;
                    if (ticks < tickMultiplicator1Threshold) {
                        level += node.step;
                    } else if (ticks < tickMultiplicator2Threshold) {
                        level += (node.step * tickMultiplicator1);
                    } else {
                        level += (node.step * tickMultiplicator2);
                    }
                    if (level > node.max) {
                        level = node.max;
                        if (timer) {
                            clearInterval(timer);
                            timer = undefined;
                        }
                    } else {
                        this.context().set('level', level);
                        node.send({ payload: level });
                    }
                    this.status({ fill: "yellow", shape: "dot", text: level });
                }, node.intervalMs);
            }

            if (action == 'brightness_move_down') {
                if (timer) {
                    clearInterval(timer);
                }
                ticks = 0;
                timer = setInterval(() => {
                    ticks++;
                    let level = this.context().get('level') || 0;
                    if (ticks < tickMultiplicator1Threshold) {
                        level -= node.step;
                    } else if (ticks < tickMultiplicator2Threshold) {
                        level -= (node.step * tickMultiplicator1);
                    } else {
                        level -= (node.step * tickMultiplicator2);
                    }

                    if (level < node.min) {
                        level = node.min;
                        if (timer) {
                            clearInterval(timer);
                            timer = undefined;
                        }
                    } else {
                        this.context().set('level', level);
                        node.send({ payload: level });
                    }

                    if (level > node.min) {
                        this.status({ fill: "yellow", shape: "dot", text: level });
                    } else {
                        this.status({ fill: "yellow", shape: "ring", text: level });
                    }
                }, node.intervalMs);

            }

            if (action == 'brightness_stop') {
                ticks = 0;
                if (timer) {
                    clearInterval(timer);
                    timer = undefined;
                }
            }
        });

        this.on('close', function () {
            if (timer) {
                clearInterval(timer);
                timer = undefined;
            }
        });
    }

    RED.nodes.registerType("E2201", E2201);
}

