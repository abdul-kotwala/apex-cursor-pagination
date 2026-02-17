import { LightningElement, track } from 'lwc';
import initCursor from '@salesforce/apex/TFB_StandardCursorController.initCursor';
import getPage from '@salesforce/apex/TFB_StandardCursorController.getPage';

const PAGE_SIZE = 10;

const COLUMNS = [
    { label: 'Account Name', fieldName: 'Name', type: 'text', sortable: false },
    { label: 'Industry', fieldName: 'Industry', type: 'text', sortable: false },
    { label: 'Phone', fieldName: 'Phone', type: 'phone', sortable: false },
    {
        label: 'Created Date',
        fieldName: 'CreatedDate',
        type: 'date',
        sortable: false,
        typeAttributes: {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }
    }
];

export default class TfbStandardCursorDemo extends LightningElement {
    columns = COLUMNS;
    @track records = [];
    cursor;
    currentPage = 0;
    totalPages = 0;
    totalRecords = 0;
    isLoading = true;
    errorMessage;

    connectedCallback() {
        this.loadInitialData();
    }

    async loadInitialData() {
        this.isLoading = true;
        this.errorMessage = undefined;
        try {
            const result = await initCursor();
            this.cursor = result.cursor;
            this.records = result.records;
            this.currentPage = result.currentPage;
            this.totalPages = result.totalPages;
            this.totalRecords = result.totalRecords;
        } catch (error) {
            this.errorMessage = this.reduceError(error);
        } finally {
            this.isLoading = false;
        }
    }

    async navigateToPage(targetPage) {
        if (targetPage < 1 || targetPage > this.totalPages) {
            return;
        }
        this.isLoading = true;
        this.errorMessage = undefined;
        try {
            const result = await getPage({
                cursor: this.cursor,
                page: targetPage,
                pageSize: PAGE_SIZE
            });
            this.cursor = result.cursor;
            this.records = result.records;
            this.currentPage = result.currentPage;
        } catch (error) {
            this.errorMessage = this.reduceError(error);
        } finally {
            this.isLoading = false;
        }
    }

    handleFirst() {
        this.navigateToPage(1);
    }

    handlePrevious() {
        this.navigateToPage(this.currentPage - 1);
    }

    handleNext() {
        this.navigateToPage(this.currentPage + 1);
    }

    handleLast() {
        this.navigateToPage(this.totalPages);
    }

    get hasRecords() {
        return this.records && this.records.length > 0;
    }

    get rowNumberOffset() {
        return (this.currentPage - 1) * PAGE_SIZE;
    }

    get showPagination() {
        return this.totalPages > 0;
    }

    get isPrevDisabled() {
        return this.isLoading || this.currentPage <= 1;
    }

    get isNextDisabled() {
        return this.isLoading || this.currentPage >= this.totalPages;
    }

    get pageInfo() {
        return `Page ${this.currentPage} of ${this.totalPages}`;
    }

    get recordCountInfo() {
        const start = (this.currentPage - 1) * PAGE_SIZE + 1;
        const end = Math.min(this.currentPage * PAGE_SIZE, this.totalRecords);
        return `Showing ${start}-${end} of ${this.totalRecords} records`;
    }

    get recordsReturned() {
        return this.records ? this.records.length : 0;
    }

    reduceError(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (error?.body?.message) {
            return error.body.message;
        }
        if (error?.message) {
            return error.message;
        }
        return 'An unknown error occurred.';
    }
}
