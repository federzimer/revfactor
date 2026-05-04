"""Remove RF — Search — * campaigns + their budgets so deploy_campaigns.py can run clean.

DESTRUCTIVE — only run if you're starting over. Safe defaults:
- Only removes campaigns matching the prefix below
- Only removes budgets that named "Budget — RF — Search — *"
- Leaves negative keyword lists, sitelinks, callouts, and conversion actions alone

Run: python3 cleanup_campaigns.py
"""

from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient

HERE = Path(__file__).parent
CUSTOMER_ID = "5342635272"
CAMPAIGN_PREFIX = "RF — Search —"
BUDGET_PREFIX = "Budget — RF — Search —"


def main():
    client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
    ga = client.get_service("GoogleAdsService")

    # Find campaigns
    campaigns = []
    for row in ga.search(
        customer_id=CUSTOMER_ID,
        query="SELECT campaign.resource_name, campaign.name, campaign.status FROM campaign",
    ):
        if row.campaign.name.startswith(CAMPAIGN_PREFIX):
            campaigns.append((row.campaign.resource_name, row.campaign.name))

    if campaigns:
        cs = client.get_service("CampaignService")
        ops = []
        for rn, name in campaigns:
            print(f"  removing campaign: {name} ({rn})")
            op = client.get_type("CampaignOperation")
            op.remove = rn
            ops.append(op)
        cs.mutate_campaigns(customer_id=CUSTOMER_ID, operations=ops)

    # Find orphan budgets
    budgets = []
    for row in ga.search(
        customer_id=CUSTOMER_ID,
        query="SELECT campaign_budget.resource_name, campaign_budget.name FROM campaign_budget",
    ):
        if row.campaign_budget.name.startswith(BUDGET_PREFIX):
            budgets.append((row.campaign_budget.resource_name, row.campaign_budget.name))

    if budgets:
        bs = client.get_service("CampaignBudgetService")
        ops = []
        for rn, name in budgets:
            print(f"  removing budget: {name} ({rn})")
            op = client.get_type("CampaignBudgetOperation")
            op.remove = rn
            ops.append(op)
        try:
            bs.mutate_campaign_budgets(customer_id=CUSTOMER_ID, operations=ops)
        except Exception as e:
            print(f"  (some budgets in use, leaving) — {e}")

    print(f"\nRemoved {len(campaigns)} campaign(s) and {len(budgets)} budget(s).")


if __name__ == "__main__":
    main()
