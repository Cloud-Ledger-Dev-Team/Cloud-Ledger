# controllers/report_controller.py
from flask import jsonify
from models.report_model import Report

class ReportController:
    """生成统计报表或图表数据"""

    def monthly_report(self, user_id):
        report = Report.generate_monthly(user_id)
        return jsonify(report)

    def summary(self, user_id):
        data = Report.get_summary(user_id)
        return jsonify(data)