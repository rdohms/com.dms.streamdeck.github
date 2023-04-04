import {
    AllDisplayCard, CardData,
    DisplayCard,
    DisplayIndicator,
    IndividualDisplayCard,
    MainDisplayCard
} from "./DisplayCard";
import {PRQueryResult} from "../ViewReviewRequests";

export class DisplayStack {
    public static MAIN_DISPLAY_ID = 'main#1';
    public static ALL_DISPLAY_ID = 'all#1';

    public stack: Record<string, DisplayCard> = {};
    public currentId: string = '';
    private idStack: string[] = [];

    populateFromQueryResult(result: PRQueryResult){

        this.addToStack(new MainDisplayCard(result.prsToReview.issueCount));
        result.prsToReview.edges.forEach(edge => {
            this.addToStack(new IndividualDisplayCard(
                edge.node.repository.name,
                edge.node.repository.nameWithOwner,
                edge.node.number,
                edge.node.state,
                edge.node.url,
                edge.node.title,
                edge.node.state,
                edge.node.isDraft,
                edge.node.isReadByViewer,
                edge.node.reviewDecision,
                edge.node.mergeable,
                edge.node.commits.nodes[0].commit.statusCheckRollup?.state,
            ));
        });
        this.addToStack(new AllDisplayCard(this));
    }

    public clearStack() {
        this.stack = {};
        this.updateIdStack();
    }

    public addToStack(card: DisplayCard) {
        this.stack[card.getId()] = card;
        this.updateIdStack();
    }

    private updateIdStack() {
        this.idStack = Object.keys(this.stack);
    }

    public jumpToNext(): DisplayCard {
        return this.navigateTicks(1);
    }

    public jumpToPrevious(): DisplayCard {
        return this.navigateTicks(-1)
    }

    public navigateTicks(ticks: number = 1): DisplayCard {
        const indexOfCurrent = this.getIndexOfCurrent();
        const destination = (indexOfCurrent + ticks);

        if (destination >= 0 && destination < this.idStack.length) {
            this.currentId = this.idStack[destination];
        } else {
            const newIndex = Math.abs( (ticks > 0)
                ? destination - this.idStack.length
                : destination + this.idStack.length
            );
            this.currentId = this.idStack[newIndex];
        }

        return this.getCurrent();
    }

    private getIndexOfCurrent() {
        return this.idStack.indexOf(this.currentId);
    }

    private getIndicatorInfo(): DisplayIndicator  {
        return {
            indicator: {
                value: (this.getIndexOfCurrent() + 1) / this.idStack.length * 100,
            }
        }
    }

    public getCurrent(): DisplayCard {
        if (this.currentId === '') {
            this.jumpToNext();
        }

        return this.stack[this.currentId];
    }

    public getCurrentCardAsLayout(): CardData {
        return { ...this.getCurrent().toPayload(), ...this.getIndicatorInfo() };
    }
}


