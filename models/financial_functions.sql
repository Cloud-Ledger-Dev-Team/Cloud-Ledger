-- ======================================================
-- Cloud Ledger 财务分析函数
-- 包含：计算恩格尔系数、储蓄率、消费分类排行和消费趋势分析
-- ======================================================

USE CloudLedger;
GO

-- ======================================================
-- 1. 计算账单恩格尔系数函数
-- 恩格尔系数 = 餐饮支出总额 / 总支出金额 × 100%
-- 参数：
--   @UserID - 用户ID
--   @StartDate - 开始日期
--   @EndDate - 结束日期
-- 返回值：恩格尔系数（保留两位小数）
-- ======================================================
CREATE FUNCTION CalculateEngelCoefficient
(
    @UserID INT,
    @StartDate DATE,
    @EndDate DATE
)
RETURNS DECIMAL(5, 2)
AS
BEGIN
    DECLARE @FoodExpense DECIMAL(18, 2);
    DECLARE @TotalExpense DECIMAL(18, 2);
    DECLARE @EngelCoefficient DECIMAL(5, 2);

    -- 计算餐饮支出总额
    SELECT @FoodExpense = ISNULL(SUM(Amount), 0)
    FROM dbo.Bills
    WHERE UserID = @UserID
      AND Type = '支出'
      AND Category = '餐饮'
      AND BillDate BETWEEN @StartDate AND @EndDate;

    -- 计算总支出金额
    SELECT @TotalExpense = ISNULL(SUM(Amount), 0)
    FROM dbo.Bills
    WHERE UserID = @UserID
      AND Type = '支出'
      AND BillDate BETWEEN @StartDate AND @EndDate;

    -- 计算恩格尔系数（避免除以0）
    IF @TotalExpense > 0
        SET @EngelCoefficient = (@FoodExpense / @TotalExpense) * 100;
    ELSE
        SET @EngelCoefficient = 0;

    RETURN @EngelCoefficient;
END;
GO

-- ======================================================
-- 2. 计算储蓄率函数
-- 储蓄率 = (总收入 - 总支出) / 总收入 × 100%
-- 参数：
--   @UserID - 用户ID
--   @StartDate - 开始日期
--   @EndDate - 结束日期
-- 返回值：储蓄率（保留两位小数）
-- ======================================================
CREATE FUNCTION CalculateSavingsRate
(
    @UserID INT,
    @StartDate DATE,
    @EndDate DATE
)
RETURNS DECIMAL(5, 2)
AS
BEGIN
    DECLARE @TotalIncome DECIMAL(18, 2);
    DECLARE @TotalExpense DECIMAL(18, 2);
    DECLARE @SavingsRate DECIMAL(5, 2);

    -- 计算总收入
    SELECT @TotalIncome = ISNULL(SUM(Amount), 0)
    FROM dbo.Bills
    WHERE UserID = @UserID
      AND Type = '收入'
      AND BillDate BETWEEN @StartDate AND @EndDate;

    -- 计算总支出
    SELECT @TotalExpense = ISNULL(SUM(Amount), 0)
    FROM dbo.Bills
    WHERE UserID = @UserID
      AND Type = '支出'
      AND BillDate BETWEEN @StartDate AND @EndDate;

    -- 计算储蓄率（避免除以0）
    IF @TotalIncome > 0
        SET @SavingsRate = ((@TotalIncome - @TotalExpense) / @TotalIncome) * 100;
    ELSE
        SET @SavingsRate = 0;

    RETURN @SavingsRate;
END;
GO

-- ======================================================
-- 3. 消费分类排行存储过程
-- 参数：
--   @UserID - 用户ID
--   @StartDate - 开始日期
--   @EndDate - 结束日期
--   @TopN - 返回前N条记录（默认10）
-- ======================================================
CREATE PROCEDURE GetExpenseCategoryRanking
    @UserID INT,
    @StartDate DATE,
    @EndDate DATE,
    @TopN INT = 10
AS
BEGIN
    SELECT TOP (@TopN)
        Category,
        SUM(Amount) AS TotalAmount,
        COUNT(BillID) AS BillCount,
        AVG(Amount) AS AvgAmount,
        (SUM(Amount) * 100.0 / (
            SELECT ISNULL(SUM(Amount), 1)
            FROM dbo.Bills
            WHERE UserID = @UserID
              AND Type = '支出'
              AND BillDate BETWEEN @StartDate AND @EndDate
        )) AS Percentage
    FROM dbo.Bills
    WHERE UserID = @UserID
      AND Type = '支出'
      AND BillDate BETWEEN @StartDate AND @EndDate
    GROUP BY Category
    ORDER BY TotalAmount DESC;
END;
GO

-- ======================================================
-- 4. 消费趋势分析存储过程
-- 参数：
--   @UserID - 用户ID
--   @StartDate - 开始日期
--   @EndDate - 结束日期
--   @GroupBy - 分组方式（'month'=按月, 'quarter'=按季度, 'year'=按年）
-- ======================================================
CREATE PROCEDURE GetExpenseTrend
    @UserID INT,
    @StartDate DATE,
    @EndDate DATE,
    @GroupBy VARCHAR(10) = 'month'
AS
BEGIN
    SET NOCOUNT ON;

    -- 根据分组方式生成对应的日期标签和分组
    IF @GroupBy = 'month'
    BEGIN
        SELECT
            FORMAT(BillDate, 'yyyy-MM') AS PeriodLabel,
            DATEADD(MONTH, DATEDIFF(MONTH, 0, BillDate), 0) AS PeriodStart,
            SUM(CASE WHEN Type = '支出' THEN Amount ELSE 0 END) AS TotalExpense,
            SUM(CASE WHEN Type = '收入' THEN Amount ELSE 0 END) AS TotalIncome
        FROM dbo.Bills
        WHERE UserID = @UserID
          AND BillDate BETWEEN @StartDate AND @EndDate
        GROUP BY FORMAT(BillDate, 'yyyy-MM'), DATEADD(MONTH, DATEDIFF(MONTH, 0, BillDate), 0)
        ORDER BY PeriodStart;
    END
    ELSE IF @GroupBy = 'quarter'
    BEGIN
        SELECT
            CONCAT(YEAR(BillDate), 'Q', DATEPART(QUARTER, BillDate)) AS PeriodLabel,
            DATEADD(QUARTER, DATEDIFF(QUARTER, 0, BillDate), 0) AS PeriodStart,
            SUM(CASE WHEN Type = '支出' THEN Amount ELSE 0 END) AS TotalExpense,
            SUM(CASE WHEN Type = '收入' THEN Amount ELSE 0 END) AS TotalIncome
        FROM dbo.Bills
        WHERE UserID = @UserID
          AND BillDate BETWEEN @StartDate AND @EndDate
        GROUP BY CONCAT(YEAR(BillDate), 'Q', DATEPART(QUARTER, BillDate)), DATEADD(QUARTER, DATEDIFF(QUARTER, 0, BillDate), 0)
        ORDER BY PeriodStart;
    END
    ELSE IF @GroupBy = 'year'
    BEGIN
        SELECT
            CAST(YEAR(BillDate) AS VARCHAR(4)) AS PeriodLabel,
            DATEADD(YEAR, DATEDIFF(YEAR, 0, BillDate), 0) AS PeriodStart,
            SUM(CASE WHEN Type = '支出' THEN Amount ELSE 0 END) AS TotalExpense,
            SUM(CASE WHEN Type = '收入' THEN Amount ELSE 0 END) AS TotalIncome
        FROM dbo.Bills
        WHERE UserID = @UserID
          AND BillDate BETWEEN @StartDate AND @EndDate
        GROUP BY CAST(YEAR(BillDate) AS VARCHAR(4)), DATEADD(YEAR, DATEDIFF(YEAR, 0, BillDate), 0)
        ORDER BY PeriodStart;
    END;
END;
GO

-- ======================================================
-- 示例用法
-- ======================================================
-- 1. 计算用户1在2023年10月的恩格尔系数
-- SELECT dbo.CalculateEngelCoefficient(1, '2023-10-01', '2023-10-31') AS EngelCoefficient;

-- 2. 计算用户1在2023年10月的储蓄率
-- SELECT dbo.CalculateSavingsRate(1, '2023-10-01', '2023-10-31') AS SavingsRate;

-- 3. 获取用户1在2023年10月的消费分类排行（前5名）
-- EXEC GetExpenseCategoryRanking @UserID = 1, @StartDate = '2023-10-01', @EndDate = '2023-10-31', @TopN = 5;

-- 4. 获取用户1在2023年的消费趋势（按月）
-- EXEC GetExpenseTrend @UserID = 1, @StartDate = '2023-01-01', @EndDate = '2023-12-31', @GroupBy = 'month';