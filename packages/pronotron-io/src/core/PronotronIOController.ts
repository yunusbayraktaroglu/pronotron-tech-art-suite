import { PronotronIOScroller } from "./PronotronIOScrollGroups";

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