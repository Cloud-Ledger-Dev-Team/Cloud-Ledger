# controllers/report_controller.py
from flask import request, jsonify
from datetime import datetime
from controllers.models_controller import db, Bill, Budget

class ReportController:
    """生成统计报表或图表数据"""

    def get_monthly_stats(self, user_id, month):
        # 解析年月
        year, month_num = map(int, month.split('-'))
        
        # 计算月份的开始和结束日期
        start_date = datetime(year, month_num, 1).date()
        if month_num == 12:
            end_date = datetime(year + 1, 1, 1).date()
        else:
            end_date = datetime(year, month_num + 1, 1).date()
        
        # 获取当月所有账单
        bills = Bill.query.filter(
            Bill.user_id == user_id,
            Bill.date >= start_date,
            Bill.date < end_date
        ).all()
        
        # 计算总收入和总支出
        income = sum(bill.amount for bill in bills if bill.type == 'income')
        expense = sum(bill.amount for bill in bills if bill.type == 'expense')
        balance = income - expense
        
        # 获取预算信息
        budget = Budget.query.filter_by(user_id=user_id, month=month).first()
        
        # 按分类统计支出
        category_stats = {}
        for bill in bills:
            if bill.type == 'expense':
                if bill.category not in category_stats:
                    category_stats[bill.category] = 0
                category_stats[bill.category] += bill.amount
        
        return jsonify({
            'success': True,
            'stats': {
                'month': month,
                'income': round(income, 2),
                'expense': round(expense, 2),
                'balance': round(balance, 2),
                'budget': round(budget.amount, 2) if budget else None,
                'budgetUsed': round((expense / budget.amount * 100), 2) if budget else 0,
                'categoryStats': category_stats
            }
        })

    def get_expense_trend(self, user_id):
        months = int(request.args.get('months', 6))
        today = datetime.now()
        trends = []
        
        for i in range(months - 1, -1, -1):
            month_num = today.month - i
            year = today.year
            
            # 处理跨年情况
            if month_num <= 0:
                month_num += 12
                year -= 1
            
            month_str = f'{year}-{month_num:02d}'
            
            # 获取该月的统计数据
            # 由于不能直接调用方法获取响应对象，我们直接计算
            year_month, month_num_part = map(int, month_str.split('-'))
            start_date = datetime(year_month, month_num_part, 1).date()
            if month_num_part == 12:
                end_date = datetime(year_month + 1, 1, 1).date()
            else:
                end_date = datetime(year_month, month_num_part + 1, 1).date()
            
            bills = Bill.query.filter(
                Bill.user_id == user_id,
                Bill.date >= start_date,
                Bill.date < end_date
            ).all()
            
            expense = sum(bill.amount for bill in bills if bill.type == 'expense')
            income = sum(bill.amount for bill in bills if bill.type == 'income')
            
            trends.append({
                'month': month_str,
                'expense': round(expense, 2),
                'income': round(income, 2)
            })
        
        return jsonify({'success': True, 'trends': trends})