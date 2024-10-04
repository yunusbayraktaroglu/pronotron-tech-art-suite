import throttle from "lodash.throttle";
import { PronotronIOScroller } from "./PronotronIOScrollGroups";

export { throttle };

export class PronotronIOController
{
    private static instance: PronotronIOScroller;

    private constructor(){}

    public static getInstance(): PronotronIOScroller {
        if ( ! PronotronIOController.instance ){
            PronotronIOController.instance = new PronotronIOScroller();
        }
        return PronotronIOController.instance;
    }
}