declare function notFound(ctx: any): Promise<void>;
/**
 * @desc middleware preventingly setting the response's status to 404, in case no path is picked up
 */
declare const _default: () => typeof notFound;
export default _default;
