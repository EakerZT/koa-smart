declare function addDefaultBody(ctx: any, next: any): Promise<void>;
/**
 * @desc middleware setting a default starting body
 * @param {Object} body The default body to persist through the app
 * @return {KoaMiddleware}
 */
declare const _default: (body?: {}) => typeof addDefaultBody;
export default _default;
