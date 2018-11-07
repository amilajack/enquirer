'use strict';

const ArrayPrompt = require('../types/array');
const utils = require('../utils');

class SelectPrompt extends ArrayPrompt {
  async dispatch(s, key) {
    if (this.options.multiple) {
      return this[key.name] ? await this[key.name](s, key) : await super.dispatch(s, key);
    }
    this.alert();
  }

  indicator(choice, i) {
    return this.options.multiple ? super.indicator(choice, i) : '';
  }

  pointer(choice, i) {
    return (!this.options.multiple || this.options.pointer) ? super.pointer(choice, i) : '';
  }

  async renderChoice(choice, i) {
    await this.onChoice(choice, i);

    let focused = this.index === i;
    let pointer = await this.pointer(choice, i);
    let indicator = await this.indicator(choice, i) + (choice.pad || '');
    let hint = await choice.hint;

    if (hint && !utils.hasColor(hint)) {
      hint = this.styles.muted(hint);
    }

    let ind = choice.indent;
    let message = await this.resolve(choice.message, this.state, choice, i);
    let line = () => [ind + pointer + indicator, message, hint].filter(Boolean).join(' ');

    if (choice.disabled) {
      message = this.styles.disabled(message);
      return line();
    }

    if (focused) {
      message = this.styles.heading(message);
    }
    return line();
  }

  async renderChoices() {
    if (this.state.submitted) return '';
    let choices = this.visible.map(async(ch, i) => await this.renderChoice(ch, i));
    let visible = await Promise.all(choices);
    if (!visible.length) visible.push(this.styles.danger('No matching choices'));
    return visible.join('\n');
  }

  format() {
    if (!this.state.submitted) return this.styles.muted(this.state.hint);
    if (Array.isArray(this.selected)) {
      return this.selected.map(choice => this.styles.primary(choice.name)).join(', ');
    }
    return this.styles.primary(this.selected.name);
  }

  async render() {
    let { submitted, size } = this.state;

    let prefix = await this.prefix();
    let separator = await this.separator();
    let message = await this.message();

    let prompt = [prefix, message, separator].filter(Boolean).join(' ');
    this.state.prompt = prompt;

    let header = await this.header();
    let output = await this.format();
    let help = await this.error() || await this.hint();
    let body = await this.renderChoices();
    let footer = await this.footer();

    if (output || !help) prompt += ' ' + output;
    if (help && !prompt.includes(help)) prompt += ' ' + help;

    if (submitted && this.options.multiple && !output && !body) {
      prompt += this.styles.danger('No items were selected');
    }

    this.clear(size);
    this.write([header, prompt, body, footer].filter(Boolean).join('\n'));
    this.restore();
  }
}

module.exports = SelectPrompt;