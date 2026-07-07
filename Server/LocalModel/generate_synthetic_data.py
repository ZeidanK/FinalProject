"""
generate_synthetic_data.py
==========================
Generates 130+ synthetic invoice examples in gemini_extractions.jsonl format,
covering all invoice styles present in the training data:
  - Israeli Hebrew company invoices (Waxman/KSP style)
  - English SaaS subscription invoices (Quizizz style)
  - GitHub-style payment receipts
  - CardCom-style Hebrew payment gateway receipts

Run from Server/LocalModel/:
  python generate_synthetic_data.py

Then run the full training pipeline:
  python generate_training_data.py --input synthetic_extractions.jsonl --output invoices_synthetic.jsonl
  # Merge with real data for best results:
  python train.py --data invoices_synthetic.jsonl --epochs 10 --output ./model
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(2024)

OUTPUT_FILE = Path("synthetic_extractions.jsonl")

# ─── Company / vendor pools ────────────────────────────────────────────────────

ISRAELI_COMPANIES = [
    ("אחים וקסמן תעשיות בע\"מ",  "510751878", "waxman",    "info@waxman.co.il"),
    ("מציאון ועודפים בע\"מ",      "515348381", "ksp",       "info@ksp.co.il"),
    ("סלקום ישראל בע\"מ",         "520044689", "cellcom",   "info@cellcom.co.il"),
    ("שופרסל בע\"מ",              "512058886", "shufersal", "info@shufersal.co.il"),
    ("בזק בינלאומי בע\"מ",        "512186002", "bezeq",     "info@bezeq.co.il"),
    ("HOT מובייל בע\"מ",          "513289472", "hot",       "info@hot.co.il"),
    ("אמישראגז בע\"מ",             "520022406", "amigas",    "info@amigas.co.il"),
    ("פרטנר תקשורת בע\"מ",        "520044958", "partner",   "info@partner.co.il"),
    ("מגה ספורט בע\"מ",           "511234567", "megasport", "info@megasport.co.il"),
    ("נטקום תקשורת בע\"מ",        "514123456", "netcom",    "info@netcom.co.il"),
    ("טכנו-וורלד בע\"מ",          "512987654", "techworld", "info@techworld.co.il"),
    ("ישראל טק סולושנס בע\"מ",    "511876543", "itech",     "info@itech.co.il"),
]

ENGLISH_COMPANIES = [
    ("GitHub, Inc.",                    "88 Colin P. Kelly Jr. Street\nSan Francisco, CA 94107\nUnited States"),
    ("Quizizz Inc",                     "3110 Main Street\nBuilding C\nSanta Monica, CA 90405\nUnited States"),
    ("Adobe Inc.",                      "345 Park Avenue\nSan Jose, CA 95110\nUnited States"),
    ("Slack Technologies, LLC",         "500 Howard Street\nSan Francisco, CA 94105\nUnited States"),
    ("Dropbox, Inc.",                   "1800 Owens Street\nSan Francisco, CA 94158\nUnited States"),
    ("Zoom Video Communications, Inc.", "55 Almaden Blvd\nSan Jose, CA 95113\nUnited States"),
    ("Notion Labs, Inc.",               "2300 Harrison Street\nSan Francisco, CA 94110\nUnited States"),
    ("Figma, Inc.",                     "760 Market Street\nSan Francisco, CA 94102\nUnited States"),
    ("Vercel Inc.",                     "340 Pine Street Suite 1200\nSan Francisco, CA 94104\nUnited States"),
    ("Linear Orbit, Inc.",              "201 Spear Street\nSan Francisco, CA 94105\nUnited States"),
    ("JetBrains s.r.o.",               "Na Hrebenech II 1718/10\nPrague, 14700\nCzech Republic"),
    ("Atlassian Pty Ltd",              "341 George Street\nSydney NSW 2000\nAustralia"),
]

GITHUB_SERVICES = [
    ("GitHub Copilot Pro - month",       10.00,  "GitHub, Inc."),
    ("GitHub Copilot Business - month",  19.00,  "GitHub, Inc."),
    ("GitHub Actions - month",            4.00,  "GitHub, Inc."),
    ("Adobe Creative Cloud - month",     54.99,  "Adobe Inc."),
    ("Figma Professional - month",       12.00,  "Figma, Inc."),
    ("Zoom Pro - month",                 14.99,  "Zoom Video Communications, Inc."),
    ("Slack Pro - month",                 7.25,  "Slack Technologies, LLC"),
    ("Dropbox Plus - month",              9.99,  "Dropbox, Inc."),
    ("Notion Plus - month",               8.00,  "Notion Labs, Inc."),
    ("Linear Business - month",           8.00,  "Linear Orbit, Inc."),
    ("JetBrains All Products - month",   24.90,  "JetBrains s.r.o."),
    ("Atlassian Jira - month",           15.00,  "Atlassian Pty Ltd"),
]

ENGLISH_PLANS = [
    ("Professional Plan - Annual",   299.00),
    ("Business Subscription",         49.00),
    ("Team License - Yearly",        599.00),
    ("Developer Plan - Annual",      199.00),
    ("Enterprise Plan - Annual",    1199.00),
    ("Starter Plan - Monthly",         9.00),
    ("Standard Plan - Monthly",       29.00),
    ("Premium Subscription",         399.00),
    ("Basic Plan - Monthly",           5.00),
    ("Growth Plan - Annual",         499.00),
    ("Scale Plan - Monthly",          79.00),
    ("Individual Plan",              144.00),
]

HEBREW_PRODUCTS = [
    ("מחשב נייד",      "מחשב נייד Dell Inspiron 15",   2800.00),
    ("טלפון סלולרי",   "Samsung Galaxy A54 256GB",      2200.00),
    ("מסך מחשב",       "LG 27 אינץ Full HD IPS",        950.00),
    ("מדפסת לייזר",    "HP LaserJet Pro M404dn",         780.00),
    ("תוכנת אנטי וירוס","Norton 360 רישיון שנתי",        160.00),
    ("כבל HDMI",       "כבל HDMI 2.1 2מ",                 42.00),
    ("עכבר אלחוטי",    "Logitech M310 אלחוטי",           110.00),
    ("מקלדת מכנית",    "Keychron K2 מכנית בלוטות",       340.00),
    ("אוזניות בלוטות", "Sony WH-1000XM5 שחור",           620.00),
    ("ראוטר WiFi",     "ASUS RT-AX88U WiFi 6",           380.00),
    ("כונן SSD",       "Samsung 870 EVO 1TB",             320.00),
    ("זיכרון RAM",     "Kingston 16GB DDR4 3200MHz",      260.00),
    ("מצלמת אינטרנט",  "Logitech C920 HD 1080p",          280.00),
    ("UPS",            "APC UPS 650VA Back-UPS",           280.00),
    ("הארכת אחריות",   "הארכת אחריות 2 שנים",             150.00),
]

ISRAELI_CITIES    = ["תל אביב", "חיפה", "ירושלים", "באר שבע", "נתניה", "ראשון לציון", "פתח תקווה", "רמת גן", "בני ברק", "אשדוד"]
ISRAELI_STREETS   = ["רחוב הרצל", "שדרות רוטשילד", "רחוב דיזנגוף", "רחוב אלנבי", "שדרות בן גוריון", "רחוב ויצמן", "רחוב ז'בוטינסקי"]
CUSTOMER_NAMES_HE = ["DA3WAH", "כרים זידאן", "דוד לוי", "משה כהן", "יוסי ישראלי", "רחל אבו", "אמיר חסן", "נועה שפירא"]
CUSTOMER_NAMES_EN = ["karim zeidan", "John Smith", "Sarah Johnson", "ZeidanK", "Alex Chen", "Maria Garcia"]

# ─── Helpers ──────────────────────────────────────────────────────────────────

def rdate(start=2023, end=2025) -> datetime:
    s = datetime(start, 1, 1)
    e = datetime(end, 12, 31)
    return s + timedelta(days=random.randint(0, (e - s).days))

def rinvnum(style="alpha") -> str:
    if style == "alpha":
        pfx = random.choice(["INV", "IN", "IV", "RC", "RCV", "TAX", "SI"])
        return pfx + "".join(str(random.randint(0, 9)) for _ in range(random.randint(6, 10)))
    if style == "numeric":
        return str(random.randint(10000, 99999999))
    if style == "transaction":
        pfx = random.choice(["ch_", "txn_", "pi_"])
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        return pfx + "".join(random.choice(chars) for _ in range(24))
    if style == "hex":
        return "".join(random.choice("0123456789ABCDEF") for _ in range(8)) + \
               "\x00" + \
               "".join(random.choice("0123456789ABCDEF") for _ in range(4))
    return str(random.randint(10000, 9999999))

def rphone():
    pfx = random.choice(["03", "02", "04", "08", "09", "077"])
    n = "".join(str(random.randint(0, 9)) for _ in range(7))
    return f"{pfx}-{n[:3]}{n[3:]}"

def rtaxid():
    return str(random.randint(500000000, 529999999))

def fmt_ils(v: float) -> str:
    """Format as Israeli amount — uses comma thousands like 2,555.00"""
    return f"{v:,.2f}"

def fmt_usd(v: float) -> str:
    return f"{v:.2f}"

# ─── Generator 1: Israeli company invoice (Waxman / KSP style) ────────────────

def gen_israeli_invoice() -> dict:
    company_name, tax_id, domain, email = random.choice(ISRAELI_COMPANIES)
    city       = random.choice(ISRAELI_CITIES)
    street     = random.choice(ISRAELI_STREETS)
    street_num = random.randint(1, 200)
    zip_code   = str(random.randint(1000000, 9999999))
    phone1, phone2 = rphone(), rphone()

    inv_date = rdate()
    date_str = inv_date.strftime("%d/%m/%y")

    invoice_num = rinvnum("alpha")
    vat_rate    = random.choice([17, 18])
    customer    = random.choice(CUSTOMER_NAMES_HE)

    items = random.sample(HEBREW_PRODUCTS, random.randint(1, 4))
    lines = ""
    subtotal = 0.0
    for i, (short, full, base) in enumerate(items, 1):
        qty     = random.randint(1, 3)
        price   = round(base * random.uniform(0.85, 1.15), 2)
        itotal  = round(price * qty, 2)
        subtotal += itotal
        lines += f"{i}{full}{qty} ₪ {fmt_ils(price)} ₪ {fmt_ils(itotal)}\n"

    subtotal   = round(subtotal, 2)
    vat_amount = round(subtotal * vat_rate / 100, 2)
    total      = round(subtotal + vat_amount, 2)

    text = (
        f"web site: www.{domain}.co.il\n"
        f"e-mail: {email}\n"
        f"{company_name}\n"
        f"{zip_code}, {city}{street_num}{street}\n"
        f"{city}\n"
        f"{phone2}פקס, {phone1}טלפון\n"
        f"{tax_id}עוסק מורשה\n"
        f"{tax_id}מספר תיק במע\"מ\n"
        f"{date_str}תאריך חשבונית\n"
        f"{date_str}תאריך הדפסה\n"
        f"{invoice_num}מספר תעודה\n"
        f"לכבוד:\n{customer}\n"
        f"חשבונית מס מקור\n"
        f"# תיאור כמות מחיר מחיר כולל\n"
        f"{lines}\n"
        f"{fmt_ils(subtotal)}\n"
        f"0.00%) הנחה כללית\n"
        f"{fmt_ils(subtotal)}\n"
        f"{fmt_ils(vat_amount)}\n"
        f"מחיר אחרי הנחה\n"
        f"{vat_rate}.00%) מע\"מ\n"
        f" ש\"ח{fmt_ils(total)}סה\"כ מחיר\n"
    )

    return {
        "text":           text,
        "vendor_name":    company_name,
        "invoice_number": invoice_num,
        "invoice_date":   date_str,
        "due_date":       None,
        "total_amount":   fmt_ils(total),
        "subtotal":       fmt_ils(subtotal),
        "vat_amount":     fmt_ils(vat_amount),
        "vat_rate":       str(vat_rate),
        "vendor_tax_id":  tax_id,
        "currency":       "ILS",
    }


# ─── Generator 2: English SaaS invoice (Quizizz style) ────────────────────────

def gen_english_saas_invoice() -> dict:
    vendor_name, address = random.choice(ENGLISH_COMPANIES)
    plan, base_price     = random.choice(ENGLISH_PLANS)

    inv_date  = rdate()
    due_date  = inv_date + timedelta(days=random.choice([0, 14, 30]))
    date_str  = inv_date.strftime("%B %d, %Y")      # April 27, 2025
    due_str   = due_date.strftime("%B %d, %Y")
    period_end = due_date.strftime("%b %d, %Y")
    period_start = inv_date.strftime("%b %d, %Y")

    price   = round(base_price * random.uniform(0.95, 1.05), 2)
    subtotal = price
    total    = price

    invoice_num = rinvnum("alpha")
    customer    = random.choice(CUSTOMER_NAMES_EN)

    text = (
        f"Invoice\n"
        f"Invoice number {invoice_num}\n"
        f"Date of issue {date_str}\n"
        f"Date due {due_str}\n"
        f"{vendor_name}\n"
        f"{address}\n\n"
        f"Bill to\n{customer}\nIsrael\nkaremziedan@gmail.com\n"
        f"${fmt_usd(total)} USD due {due_str}\n"
        f"Pay online\n"
        f"Description Qty Unit price Amount\n"
        f"{plan}\n"
        f"{period_start} – {period_end}\n"
        f"1 ${fmt_usd(price)} ${fmt_usd(price)}\n \n"
        f"Subtotal ${fmt_usd(subtotal)}\n"
        f"Total ${fmt_usd(total)}\n"
        f"Amount due ${fmt_usd(total)} USD"
    )

    return {
        "text":           text,
        "vendor_name":    vendor_name,
        "invoice_number": invoice_num,
        "invoice_date":   date_str,
        "due_date":       due_str,
        "total_amount":   fmt_usd(total),
        "subtotal":       fmt_usd(subtotal),
        "vat_amount":     None,
        "vat_rate":       None,
        "vendor_tax_id":  None,
        "currency":       "USD",
    }


# ─── Generator 3: GitHub-style payment receipt ────────────────────────────────

def gen_github_receipt() -> dict:
    service, price, vendor_name = random.choice(GITHUB_SERVICES)

    inv_date    = rdate()
    next_period = inv_date + timedelta(days=30)
    date_str    = inv_date.strftime("%Y-%m-%d")

    invoice_num = rinvnum("transaction")
    last_four   = str(random.randint(1000, 9999))
    card_type   = random.choice(["Visa", "Mastercard", "American Express"])

    total   = round(price, 2)
    support = vendor_name.split(',')[0].lower().replace(' ', '').replace('.', '')

    text = (
        f"We received payment for your subscription. Thanks for your business!\n"
        f"Questions? Visit https://support.{support}.com/contact.\n"
        f"Date {date_str} 10:28AM PDT\n"
        f"Account billed ZeidanK (karemziedan@gmail.com)\n"
        f"Transaction ID {invoice_num}\n"
        f"Charged to {card_type} (4*** **** **** {last_four})\n"
        f"Description Amount\n"
        f"{service} ${fmt_usd(price)} USD\n"
        f"{inv_date.strftime('%b %d, %Y')} - {next_period.strftime('%b %d, %Y')}\n"
        f"Tax $0.00 USD\n"
        f"Total ${fmt_usd(total)} USD*\n"
        f"{vendor_name}\n"
        f"https://support.{support}.com/contact\n"
        f"* VAT/GST paid directly by provider, where applicable"
    )

    return {
        "text":           text,
        "vendor_name":    vendor_name,
        "invoice_number": invoice_num,
        "invoice_date":   date_str,
        "due_date":       None,
        "total_amount":   fmt_usd(total),
        "subtotal":       fmt_usd(total),
        "vat_amount":     None,
        "vat_rate":       None,
        "vendor_tax_id":  None,
        "currency":       "USD",
    }


# ─── Generator 4: CardCom-style Hebrew payment gateway receipt ─────────────────

def gen_cardcom_receipt() -> dict:
    inv_date = rdate()
    date_str = inv_date.strftime("%d/%m/%Y")

    installments = random.choice([1, 3, 6, 10, 12])
    base_price   = random.choice([49.00, 99.00, 199.00, 250.00, 499.00, 599.00, 999.00, 1200.00, 1500.00, 2500.00])
    total        = round(base_price * random.uniform(0.9, 1.1), 2)

    vat_rate   = 17
    subtotal   = round(total / (1 + vat_rate / 100), 2)
    vat_amount = round(total - subtotal, 2)

    invoice_num  = str(random.randint(10000, 999999))
    trans_num    = str(random.randint(100000000, 999999999))
    tax_id       = rtaxid()
    card_last4   = str(random.randint(1000, 9999))
    customer     = random.choice(["karim", "דוד", "אמיר", "יוסי", "רחל", "נועה", "ליאור", "מורן"])

    fmt_inv = f"RM{random.randint(10000000000000, 99999999999999):014d}"

    text = (
        f":\nדובכל\n{customer}\n \n054456850\n.ז.ת\n"
        f"0584596404\n:\nדיינ\nkaremziedan@gmail.com\n :\nךיראת\n16:50\n \n"
        f"{date_str}\nרוקמ\nמ\n\"עמב\n \nבייח\n{vat_rate}.00%\n \nהבגנ\n \n"
        f"מ\n\"עמ\nלקש\n \nכ\n\"הס\n{subtotal:.2f}\n"
        f"₪{vat_amount:.2f}\n₪{total:.2f}\n"
        f"{fmt_inv}\nםישדוח\n \n{installments}\n- \nל\n \nיונמ\n1.00\n"
        f"₪{total:.2f}\n:\nםולשתה\n \nןפוא\n(\nNIS\n )\n{total:.2f}₪\n"
        f": \nיארשא\n \nסיטרכ\n{trans_num}\nרפסמ\n \nהקסע\n\n"
        f"{tax_id}\n \nמ\n\"עב\n \nהרבח\n"
        f"{invoice_num}\n \nרפסמ\n \nהלבק\n \nסמ\n \nתינובשח\n"
        f"{card_last4}\nסיטרכ\n| \n{date_str}\n \nךיראת\n"
        f"מ\n\"עב\n \nםוקדראק\n \nתרבח\n :\nםושיו\n \nןונכית\n"
        f"http://www.cardcom.solutions"
    )

    return {
        "text":           text,
        "vendor_name":    None,
        "invoice_number": invoice_num,
        "invoice_date":   date_str,
        "due_date":       date_str,
        "total_amount":   f"{total:.2f}",
        "subtotal":       f"{subtotal:.2f}",
        "vat_amount":     f"{vat_amount:.2f}",
        "vat_rate":       str(vat_rate),
        "vendor_tax_id":  tax_id,
        "currency":       "ILS",
    }


# ─── Generator 5: Simple English B2B invoice ──────────────────────────────────

def gen_english_b2b_invoice() -> dict:
    vendor_name, address = random.choice(ENGLISH_COMPANIES)
    plan, base_price = random.choice(ENGLISH_PLANS)

    inv_date = rdate()
    due_date = inv_date + timedelta(days=30)
    date_str = inv_date.strftime("%Y-%m-%d")
    due_str  = due_date.strftime("%Y-%m-%d")

    qty      = random.randint(1, 5)
    unit     = round(base_price, 2)
    subtotal = round(unit * qty, 2)
    tax_rate = random.choice([0, 8, 10])
    tax_amt  = round(subtotal * tax_rate / 100, 2)
    total    = round(subtotal + tax_amt, 2)

    invoice_num = rinvnum("alpha")
    customer    = random.choice(CUSTOMER_NAMES_EN)

    tax_line = f"Tax ({tax_rate}%)              ${fmt_usd(tax_amt)}\n" if tax_rate else ""

    text = (
        f"INVOICE\n\n"
        f"From: {vendor_name}\n"
        f"{address}\n\n"
        f"To: {customer}\n"
        f"karemziedan@gmail.com\n\n"
        f"Invoice #: {invoice_num}\n"
        f"Invoice Date: {date_str}\n"
        f"Due Date: {due_str}\n\n"
        f"Description                    Qty    Unit Price    Amount    VAT Rate\n"
        f"{plan:<30} {qty}      ${fmt_usd(unit)}       ${fmt_usd(subtotal)}    {tax_rate}%\n\n"
        f"Subtotal                                          ${fmt_usd(subtotal)}\n"
        f"{tax_line}"
        f"TOTAL                                             ${fmt_usd(total)} USD\n"
    )

    return {
        "text":           text,
        "vendor_name":    vendor_name,
        "invoice_number": invoice_num,
        "invoice_date":   date_str,
        "due_date":       due_str,
        "total_amount":   fmt_usd(total),
        "subtotal":       fmt_usd(subtotal),
        "vat_amount":     fmt_usd(tax_amt) if tax_rate else None,
        "vat_rate":       str(tax_rate) if tax_rate else None,
        "vendor_tax_id":  None,
        "currency":       "USD",
    }


# ─── Generator 6: Installment invoice (BrightCourse/Desk&More style) ─────────

INSTALLMENT_VENDORS = [
    ("BrightCourse Academy",         "Remote Learning Center, Jerusalem 9103401",   "finance@brightcourse.example"),
    ("Desk&More Furniture Ltd.",      "14 Hataas St., Haifa 3309502",                "billing@deskmore.example"),
    ("Laptop Place",                  "7 Tech Park, Netanya 4250407",                "info@laptopplace.example"),
    ("SmartHome Solutions Ltd.",      "22 Innovation Blvd, Tel Aviv 6423001",        "billing@smarthome.example"),
    ("TechGear Direct",               "5 Weizmann St., Rehovot 7610001",             "orders@techgear.example"),
    ("FurniturePlus Israel",          "38 Ben Gurion Ave, Rishon LeZion 7521201",    "shop@furniplus.example"),
    ("ElectroCity Ltd.",              "11 Dizengoff St., Tel Aviv 6433201",           "support@electrocity.example"),
    ("HealthFirst Medical Supplies",  "3 HaShalom Rd., Tel Aviv 6731401",            "billing@healthfirst.example"),
]

INSTALLMENT_PRODUCTS = [
    ("Data analytics course",             [("Data analytics course", 1_600.00), ("Certificate processing", 200.00)]),
    ("Home office furniture package",     [("Ergo desk 140cm", 1_450.00), ("Adjustable office chair", 1_180.00), ("Cable tray + assembly", 970.00)]),
    ("Laptop and accessories",            [("ProBook 14 laptop", 4_800.00), ("Extended warranty - 2 years", 420.00), ("USB-C adapter", 180.00)]),
    ("Smart home starter kit",            [("Smart speaker hub", 890.00), ("Sensor pack x4", 480.00), ("Installation service", 430.00)]),
    ("Professional camera kit",           [("Mirrorless camera body", 5_200.00), ("24-70mm lens", 2_400.00), ("Camera bag", 400.00)]),
    ("Online fitness subscription",       [("Annual coaching plan", 1_800.00), ("Equipment package", 600.00)]),
    ("Medical equipment",                 [("CPAP machine", 3_200.00), ("Accessories kit", 400.00)]),
    ("Office renovation package",         [("Standing desks x3", 4_500.00), ("Ergonomic chairs x3", 2_700.00), ("Monitor arms x3", 800.00)]),
]


def gen_installment_invoice() -> dict:
    vendor_name, address, email = random.choice(INSTALLMENT_VENDORS)
    product_name, line_items    = random.choice(INSTALLMENT_PRODUCTS)
    installments = random.choice([3, 6, 9, 10, 12])

    inv_date    = rdate()
    first_charge = inv_date + timedelta(days=random.choice([7, 14, 30]))
    date_str    = inv_date.strftime("%Y-%m-%d")
    due_str     = first_charge.strftime("%Y-%m-%d")

    invoice_num = f"INV-{vendor_name[:3].upper()}-{inv_date.strftime('%Y-%m%d')[:12]}-{random.randint(1000,9999)}"
    customer    = random.choice(CUSTOMER_NAMES_EN)

    vat_rate   = 17
    # Scale items randomly
    scale      = random.uniform(0.8, 1.2)
    lines_text = ""
    raw_sub    = 0.0
    for desc, price in line_items:
        p = round(price * scale, 2)
        raw_sub += p
        lines_text += f"{desc} 1 ILS {fmt_ils(p)} ILS {fmt_ils(p)}\n"

    subtotal   = round(raw_sub / (1 + vat_rate / 100), 2)
    vat_amount = round(raw_sub - subtotal, 2)
    total      = round(subtotal + vat_amount, 2)

    installment_amount = round(total / installments, 2)
    # adjust last installment for rounding
    schedule = ""
    for i in range(1, installments + 1):
        charge_date = (first_charge + timedelta(days=30 * (i - 1))).strftime("%Y-%m-%d")
        schedule   += f"{i} {charge_date} ILS {fmt_ils(installment_amount)}\n"

    text = (
        f"INVOICE\n\n"
        f"{vendor_name}\n"
        f"{address}\n"
        f"{email}\n\n"
        f"Bill to\n{customer}\nkaremziedan@gmail.com\nHaifa, Israel\n\n"
        f"Invoice details\n"
        f"Invoice ID: {invoice_num}\n"
        f"Issue date: {date_str}\n"
        f"Customer: K Z / Demo Account\n"
        f"Currency: ILS\n"
        f"{product_name}\n"
        f"Monthly payment plan - Payment 1 of {installments}\n"
        f"Paid in {installments} installments of ILS {fmt_ils(installment_amount)}\n"
        f"ILS {fmt_ils(total)}\n\n"
        f"Description Qty Unit price Line total\n"
        f"{lines_text}\n"
        f"Subtotal ILS {fmt_ils(subtotal)}\n"
        f"VAT included ILS {fmt_ils(vat_amount)}\n"
        f"Total ILS {fmt_ils(total)}\n\n"
        f"Installment schedule\n"
        f"# Expected charge date Amount\n"
        f"{schedule}"
    )

    return {
        "text":           text,
        "vendor_name":    vendor_name,
        "invoice_number": invoice_num,
        "invoice_date":   date_str,
        "due_date":       due_str,
        "total_amount":   fmt_ils(total),
        "subtotal":       fmt_ils(subtotal),
        "vat_amount":     fmt_ils(vat_amount),
        "vat_rate":       str(vat_rate),
        "vendor_tax_id":  None,
        "currency":       "ILS",
    }


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    generators = [
        (gen_israeli_invoice,       50),   # Waxman/KSP style — Hebrew
        (gen_english_saas_invoice,  45),   # Quizizz style — English
        (gen_github_receipt,        45),   # GitHub receipt — English
        (gen_cardcom_receipt,       40),   # CardCom style — Hebrew RTL
        (gen_english_b2b_invoice,   40),   # Clean B2B invoice — English
        (gen_installment_invoice,   40),   # Installment invoice — new pattern
    ]

    examples = []
    for fn, count in generators:
        for _ in range(count):
            try:
                examples.append(fn())
            except Exception as e:
                print(f"[WARN] {fn.__name__} failed: {e}")

    random.shuffle(examples)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    print(f"\nGenerated {len(examples)} synthetic examples -> {OUTPUT_FILE}")
    print("\nNext steps:")
    print("  python generate_training_data.py --input synthetic_extractions.jsonl --output invoices_synthetic.jsonl")
    print("  python train.py --data invoices_synthetic.jsonl --epochs 10 --output ./model")
    print("\nTo combine with your real data for best results:")
    print("  # On Windows PowerShell:")
    print("  Get-Content invoices.jsonl, invoices_synthetic.jsonl | Set-Content invoices_combined.jsonl")
    print("  python train.py --data invoices_combined.jsonl --epochs 10 --output ./model")


if __name__ == "__main__":
    main()
