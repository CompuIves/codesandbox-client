import { OVERFLOW_WRAP } from '../property-descriptors/overflow-wrap';
import { fromCodePoint, LineBreaker, toCodePoints } from 'css-line-break';
import { Bounds, parseBounds } from './bounds';
import { FEATURES } from '../../core/features';
export class TextBounds {
    constructor(text, bounds) {
        this.text = text;
        this.bounds = bounds;
    }
}
export const parseTextBounds = (value, styles, node) => {
    const textList = breakText(value, styles);
    const textBounds = [];
    let offset = 0;
    textList.forEach(text => {
        if (styles.textDecorationLine.length || text.trim().length > 0) {
            if (FEATURES.SUPPORT_RANGE_BOUNDS) {
                textBounds.push(new TextBounds(text, getRangeBounds(node, offset, text.length)));
            }
            else {
                const replacementNode = node.splitText(text.length);
                textBounds.push(new TextBounds(text, getWrapperBounds(node)));
                node = replacementNode;
            }
        }
        else if (!FEATURES.SUPPORT_RANGE_BOUNDS) {
            node = node.splitText(text.length);
        }
        offset += text.length;
    });
    return textBounds;
};
const getWrapperBounds = (node) => {
    const ownerDocument = node.ownerDocument;
    if (ownerDocument) {
        const wrapper = ownerDocument.createElement('html2canvaswrapper');
        wrapper.appendChild(node.cloneNode(true));
        const parentNode = node.parentNode;
        if (parentNode) {
            parentNode.replaceChild(wrapper, node);
            const bounds = parseBounds(wrapper);
            if (wrapper.firstChild) {
                parentNode.replaceChild(wrapper.firstChild, wrapper);
            }
            return bounds;
        }
    }
    return new Bounds(0, 0, 0, 0);
};
const getRangeBounds = (node, offset, length) => {
    const ownerDocument = node.ownerDocument;
    if (!ownerDocument) {
        throw new Error('Node has no owner document');
    }
    const range = ownerDocument.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset + length);
    return Bounds.fromClientRect(range.getBoundingClientRect());
};
const breakText = (value, styles) => {
    return styles.letterSpacing !== 0 ? toCodePoints(value).map(i => fromCodePoint(i)) : breakWords(value, styles);
};
const breakWords = (str, styles) => {
    const breaker = LineBreaker(str, {
        lineBreak: styles.lineBreak,
        wordBreak: styles.overflowWrap === OVERFLOW_WRAP.BREAK_WORD ? 'break-word' : styles.wordBreak
    });
    const words = [];
    let bk;
    while (!(bk = breaker.next()).done) {
        if (bk.value) {
            words.push(bk.value.slice());
        }
    }
    return words;
};
