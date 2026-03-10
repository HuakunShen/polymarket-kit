import json
import re
from typing import Optional

import httpx

def extract_wallet_address_from_profile(username: str, timeout: float = 10.0) -> Optional[str]:
    """
    Scrape the Polymarket profile page for a given username and extract
    their wallet address from the Next.js page data.
    
    Args:
        username: The Polymarket username (e.g. 'S-Snake')
        timeout: Request timeout in seconds
        
    Returns:
        The wallet address if found, otherwise None
    """
    if username.startswith("0x") and len(username) == 42:
        return username
        
    url = f"https://polymarket.com/@{username}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.get(url, headers=headers)
            if resp.status_code == 200:
                match = re.search(r'id="__NEXT_DATA__"[^>]*>(.*?)</script>', resp.text)
                if match:
                    data = json.loads(match.group(1))
                    page_props = data.get("props", {}).get("pageProps", {})
                    
                    address = (
                        page_props.get("proxyAddress") or 
                        page_props.get("baseAddress") or 
                        page_props.get("primaryAddress") or
                        page_props.get("user", {}).get("address") or
                        page_props.get("profile", {}).get("address")
                    )
                    if address:
                        return str(address)
    except Exception as e:
        # Intentionally swallow errors to support fallback gracefully
        pass
        
    return None
