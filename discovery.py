# ==============================================================================
# DISCOVERY & FILTER SYSTEM - Tính năng Tìm kiếm & Khám phá
# ==============================================================================
# File: discovery.py
# Mô tả: Xử lý logic tìm kiếm, lọc và hiển thị newsfeed cho đồ thất lạc
# 
# Tính năng chính:
#   - Trang Newsfeed với cards và pagination
#   - Bộ lọc nâng cao (Advanced Filter)
#   - Tìm kiếm theo từ khóa
#
# Author: Team 1X-BET-23-1
# Created: 2026-02-02
# ==============================================================================

from flask import Blueprint, render_template, request
from models import db, Item
from datetime import datetime, timedelta

# ==============================================================================
# BLUEPRINT SETUP
# ==============================================================================
# Tạo Blueprint riêng cho tính năng Discovery
# Giúp tách biệt code, dễ merge trên GitHub
discovery_bp = Blueprint('discovery', __name__)

# ==============================================================================
# DANH SÁCH DANH MỤC (CATEGORIES)
# ==============================================================================
# Danh sách các danh mục để lọc đồ vật
# Mỗi danh mục có:
#   - value: Giá trị dùng trong URL parameter
#   - label: Tên hiển thị trên UI
#   - keywords: Danh sách từ khóa để tìm kiếm (linh hoạt hơn)
CATEGORIES = [
    {'value': 'wallet', 'label': 'Ví / Bóp', 'keywords': ['ví', 'bóp', 'wallet', 'tiền']},
    {'value': 'phone', 'label': 'Điện thoại', 'keywords': ['điện thoại', 'phone', 'iphone', 'samsung', 'oppo', 'xiaomi', 'realme', 'dt']},
    {'value': 'laptop', 'label': 'Laptop / Máy tính', 'keywords': ['laptop', 'máy tính', 'macbook', 'dell', 'asus', 'hp', 'lenovo', 'acer', 'computer']},
    {'value': 'card', 'label': 'Thẻ / Giấy tờ', 'keywords': ['thẻ', 'giấy tờ', 'cmnd', 'cccd', 'thẻ sinh viên', 'thẻ xe', 'card', 'chứng minh', 'căn cước', 'bằng lái']},
    {'value': 'key', 'label': 'Chìa khóa', 'keywords': ['chìa khóa', 'chìa', 'khóa', 'key', 'móc khóa']},
    {'value': 'bag', 'label': 'Túi / Balo', 'keywords': ['túi', 'balo', 'bag', 'cặp', 'ba lô', 'túi xách']},
    {'value': 'clothes', 'label': 'Quần áo', 'keywords': ['quần', 'áo', 'giày', 'dép', 'mũ', 'nón', 'kính', 'đồng hồ', 'clothes']},
    {'value': 'other', 'label': 'Khác', 'keywords': []},
]

# ==============================================================================
# DANH SÁCH KHU VỰC (LOCATIONS)
# ==============================================================================
# Danh sách các khu vực trong trường
# Mỗi khu vực có keywords để tìm kiếm linh hoạt
LOCATIONS = [
    {'value': 'dom_a', 'label': 'Dom A', 'keywords': ['dom a', 'tòa a', 'building a']},
    {'value': 'dom_b', 'label': 'Dom B', 'keywords': ['dom b', 'tòa b', 'building b']},
    {'value': 'dom_c', 'label': 'Dom C', 'keywords': ['dom c', 'tòa c', 'building c']},
    {'value': 'dom_d', 'label': 'Dom D', 'keywords': ['dom d', 'tòa d', 'building d']},
    {'value': 'dom_e', 'label': 'Dom E', 'keywords': ['dom e', 'tòa e', 'building e']},
    {'value': 'canteen', 'label': 'Canteen', 'keywords': ['canteen', 'căn tin', 'nhà ăn']},
    {'value': 'library', 'label': 'Thư viện', 'keywords': ['thư viện', 'library', 'lrc']},
    {'value': 'gym', 'label': 'Phòng Gym', 'keywords': ['gym', 'phòng gym', 'phòng tập']},
    {'value': 'parking', 'label': 'Bãi xe', 'keywords': ['bãi xe', 'parking', 'nhà xe', 'gửi xe']},
    {'value': 'other', 'label': 'Khác', 'keywords': []},
]

# ==============================================================================
# PAGINATION SETTINGS
# ==============================================================================
ITEMS_PER_PAGE = 12  # Số tin mỗi trang

# ==============================================================================
# ROUTE: /discover - Trang Khám Phá & Lọc
# ==============================================================================
@discovery_bp.route('/discover')
def discover():
    """
    Trang chính cho tính năng Discovery & Filter.
    
    Query Parameters (tất cả đều optional):
        - q: Từ khóa tìm kiếm (trong tiêu đề/mô tả)
        - item_type: Loại tin ('Lost' hoặc 'Found')
        - category: Danh mục đồ vật
        - location: Khu vực
        - date_from: Ngày bắt đầu (YYYY-MM-DD)
        - date_to: Ngày kết thúc (YYYY-MM-DD)
        - page: Số trang (mặc định 1)
    
    Returns:
        Rendered template với danh sách items đã lọc và pagination
    """
    
    # -------------------------------------------------------------------------
    # BƯỚC 1: Lấy các tham số lọc từ URL
    # -------------------------------------------------------------------------
    search_query = request.args.get('q', '').strip()
    item_type = request.args.get('item_type', '').strip()
    category = request.args.get('category', '').strip()
    location = request.args.get('location', '').strip()
    date_from = request.args.get('date_from', '').strip()
    date_to = request.args.get('date_to', '').strip()
    page = request.args.get('page', 1, type=int)
    
    # -------------------------------------------------------------------------
    # BƯỚC 2: Xây dựng query với các điều kiện lọc
    # -------------------------------------------------------------------------
    # Bắt đầu với query cơ bản, sắp xếp theo thời gian mới nhất
    query = Item.query.order_by(Item.date_posted.desc())
    
    # Lọc theo từ khóa tìm kiếm (tìm trong tiêu đề VÀ mô tả)
    if search_query:
        search_pattern = f'%{search_query}%'
        query = query.filter(
            (Item.title.ilike(search_pattern)) | 
            (Item.description.ilike(search_pattern))
        )
    
    # Lọc theo loại tin (Lost/Found)
    if item_type and item_type in ['Lost', 'Found']:
        query = query.filter(Item.item_type == item_type)
    
    # Lọc theo danh mục - sử dụng keywords để tìm linh hoạt hơn
    if category:
        # Tìm danh mục và lấy danh sách keywords
        category_data = next(
            (cat for cat in CATEGORIES if cat['value'] == category), 
            None
        )
        if category_data and category_data.get('keywords'):
            # Tạo điều kiện OR cho tất cả keywords
            from sqlalchemy import or_
            keyword_conditions = []
            for keyword in category_data['keywords']:
                keyword_pattern = f'%{keyword}%'
                keyword_conditions.append(Item.title.ilike(keyword_pattern))
                keyword_conditions.append(Item.description.ilike(keyword_pattern))
            # Áp dụng filter: bài chứa BẤT KỲ keyword nào
            if keyword_conditions:
                query = query.filter(or_(*keyword_conditions))
    
    # Lọc theo khu vực - sử dụng keywords để tìm linh hoạt hơn
    if location:
        # Tìm khu vực và lấy danh sách keywords
        location_data = next(
            (loc for loc in LOCATIONS if loc['value'] == location), 
            None
        )
        if location_data and location_data.get('keywords'):
            # Tạo điều kiện OR cho tất cả keywords
            from sqlalchemy import or_
            location_conditions = []
            for keyword in location_data['keywords']:
                location_conditions.append(Item.location.ilike(f'%{keyword}%'))
            # Áp dụng filter: location chứa BẤT KỲ keyword nào
            if location_conditions:
                query = query.filter(or_(*location_conditions))
    
    # Lọc theo ngày bắt đầu
    if date_from:
        try:
            from_date = datetime.strptime(date_from, '%Y-%m-%d')
            query = query.filter(Item.date_posted >= from_date)
        except ValueError:
            pass  # Bỏ qua nếu format sai
    
    # Lọc theo ngày kết thúc
    if date_to:
        try:
            to_date = datetime.strptime(date_to, '%Y-%m-%d')
            # Thêm 1 ngày để bao gồm cả ngày kết thúc
            to_date = to_date + timedelta(days=1)
            query = query.filter(Item.date_posted < to_date)
        except ValueError:
            pass  # Bỏ qua nếu format sai
    
    # -------------------------------------------------------------------------
    # BƯỚC 3: Thực hiện Pagination
    # -------------------------------------------------------------------------
    pagination = query.paginate(
        page=page, 
        per_page=ITEMS_PER_PAGE, 
        error_out=False
    )
    items = pagination.items
    
    # -------------------------------------------------------------------------
    # BƯỚC 4: Thống kê nhanh
    # -------------------------------------------------------------------------
    total_lost = Item.query.filter_by(item_type='Lost').count()
    total_found = Item.query.filter_by(item_type='Found').count()
    
    # -------------------------------------------------------------------------
    # BƯỚC 5: Render template
    # -------------------------------------------------------------------------
    return render_template(
        'discover.html',
        items=items,
        pagination=pagination,
        # Truyền các giá trị filter hiện tại để giữ state
        current_filters={
            'q': search_query,
            'item_type': item_type,
            'category': category,
            'location': location,
            'date_from': date_from,
            'date_to': date_to,
        },
        # Truyền danh sách options cho filter
        categories=CATEGORIES,
        locations=LOCATIONS,
        # Thống kê
        total_lost=total_lost,
        total_found=total_found,
    )


# ==============================================================================
# ROUTE: /api/discover/stats - API Thống kê (Optional)
# ==============================================================================
@discovery_bp.route('/api/discover/stats')
def discover_stats():
    """
    API endpoint trả về thống kê nhanh.
    Có thể dùng cho AJAX hoặc dashboard.
    """
    from flask import jsonify
    
    total_items = Item.query.count()
    total_lost = Item.query.filter_by(item_type='Lost').count()
    total_found = Item.query.filter_by(item_type='Found').count()
    
    # Thống kê 7 ngày gần nhất
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_lost = Item.query.filter(
        Item.item_type == 'Lost',
        Item.date_posted >= week_ago
    ).count()
    recent_found = Item.query.filter(
        Item.item_type == 'Found',
        Item.date_posted >= week_ago
    ).count()
    
    return jsonify({
        'total_items': total_items,
        'total_lost': total_lost,
        'total_found': total_found,
        'recent_lost': recent_lost,
        'recent_found': recent_found,
    })
