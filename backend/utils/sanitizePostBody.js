const sanitizeHtml = require('sanitize-html');

const SAFE_HTML_OPTIONS = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img", "h1", "h2", "h3", "blockquote"
    ]),
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "width", "height", "loading"],
    },
    allowedSchemes: ["http", "https"],
};

function sanitizePostBody(html) {
    if (typeof html !== "string") return "";
    return sanitizeHtml(html, SAFE_HTML_OPTIONS)
}

module.exports = { sanitizePostBody };