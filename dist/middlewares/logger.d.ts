declare function logger(ctx: any, next: any): Promise<void>;
/**
 * @desc middleware handling logging each time a request is made
 */
declare const _default: () => typeof logger;
export default _default;
