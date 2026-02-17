/**
 * @description  Apex controller demonstrating Database.PaginationCursor for UI-based pagination.
 *               Pagination cursors skip deleted records to always return consistent page sizes.
 *               Up to 100K rows, 200K daily instances. Cursor is a snapshot -- totalRecords is
 *               immutable once created. initPaginationCursor() returns full metadata;
 *               getPage() returns only what changes per page.
 * @apiVersion   66.0
 */
public with sharing class TFB_PaginationCursorController {

    private static final Integer DEFAULT_PAGE_SIZE = 10;

    public class PaginationCursorResult {
        @AuraEnabled public Database.PaginationCursor paginationCursor { get; set; }
        @AuraEnabled public List<Account> records { get; set; }
        @AuraEnabled public Integer totalRecords { get; set; }
        @AuraEnabled public Integer nextIndex { get; set; }
        @AuraEnabled public Integer deletedRows { get; set; }
        @AuraEnabled public Boolean hasMorePages { get; set; }
        @AuraEnabled public Integer currentPage { get; set; }
    }

    /**
     * @description  Creates pagination cursor, returns first page + immutable totalRecords.
     *               The client stores totalRecords once and derives estimatedTotalPages from it.
     */
    @AuraEnabled
    public static PaginationCursorResult initPaginationCursor() {
        try {
            Database.PaginationCursor pagCursor = Database.getPaginationCursor(
                'SELECT Id, Name, Industry, Phone, CreatedDate FROM Account ORDER BY Name'
            );
            Integer totalRecords = pagCursor.getNumRecords();

            PaginationCursorResult result = new PaginationCursorResult();
            result.paginationCursor = pagCursor;
            result.totalRecords = totalRecords;
            result.currentPage = 1;

            if (totalRecords == 0) {
                result.records = new List<Account>();
                result.nextIndex = 0;
                result.deletedRows = 0;
                result.hasMorePages = false;
                return result;
            }

            Database.CursorFetchResult fetchResult = pagCursor.fetchPage(0, DEFAULT_PAGE_SIZE);
            result.records = (List<Account>) fetchResult.getRecords();
            result.nextIndex = fetchResult.getNextIndex();
            result.deletedRows = fetchResult.getNumDeletedRecords();
            result.hasMorePages = fetchResult.isDone();
            return result;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * @description  Fetches a page at the given startIndex. Returns cursor + page data + navigation metadata.
     *               totalRecords is not recomputed -- the client retains it from init.
     *               Single safeguard: clamp startIndex and fetchSize to prevent out-of-bounds.
     */
    @AuraEnabled
    public static PaginationCursorResult getPage(
        Database.PaginationCursor pagCursor,
        Integer startIndex,
        Integer pageSize,
        Integer page
    ) {
        try {
            Integer totalRecords = pagCursor.getNumRecords();
            Integer safeStart = Math.max(startIndex, 0);
            Integer fetchSize = Math.min(pageSize, Math.max(totalRecords - safeStart, 0));

            PaginationCursorResult result = new PaginationCursorResult();
            result.paginationCursor = pagCursor;
            result.currentPage = page;

            if (fetchSize <= 0) {
                result.records = new List<Account>();
                result.nextIndex = totalRecords;
                result.deletedRows = 0;
                result.hasMorePages = false;
                return result;
            }

            Database.CursorFetchResult fetchResult = pagCursor.fetchPage(safeStart, fetchSize);
            result.records = (List<Account>) fetchResult.getRecords();
            result.nextIndex = fetchResult.getNextIndex();
            result.deletedRows = fetchResult.getNumDeletedRecords();
            result.hasMorePages = fetchResult.isDone();
            return result;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
