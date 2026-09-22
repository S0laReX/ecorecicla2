class CustomModelError extends Error {
  /** @param {string} model @param {string} message @param {string} [errorCode] @param {number} [statusCode] */
  constructor(model, message, errorCode = 'VALIDATION_ERROR', statusCode = 422) {
    super(message); this.name = 'CustomModelError'; this.model = model;
    this.errorCode = errorCode; this.statusCode = statusCode;
  }
}
module.exports = CustomModelError;
