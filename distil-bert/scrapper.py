from newspaper import Article
from urllib.parse import urlparse

def get_domain(url):
    return urlparse(url).netloc.replace("www.", "")

def check_credibility(domain):
    source_cred = {
        "bbc.com": "This source is widely recognized as a credible and reputable news organization.",
        "cnn.com": "This source is widely recognized as a credible and reputable news organization.",
        "reuters.com": "This source is widely recognized as a credible and reputable news organization.",
        "apnews.com": "This source is widely recognized as a credible and reputable news organization.",
        "nytimes.com": "This source is widely recognized as a credible and reputable news organization.",
        "theguardian.com": "This source is widely recognized as a credible and reputable news organization.",
        "npr.org": "This source is widely recognized as a credible and reputable news organization.",
        "bloomberg.com": "This source is widely recognized as a credible and reputable news organization.",
        "aljazeera.com": "This source is widely recognized as a credible and reputable news organization.",

        "theonion.com": "This source is known for publishing satirical and humorous content, not real news.",
        "babylonbee.com": "This source is known for publishing satirical and humorous content, not real news.",
        "clickhole.com": "This source is known for publishing satirical and humorous content, not real news.",

        "infowars.com": "This source is widely regarded as a purveyor of fake news and conspiracy theories.",
        "beforeitsnews.com": "This source is widely regarded as a purveyor of fake news and conspiracy theories.",
        "naturalnews.com": "This source is widely regarded as a purveyor of fake news and conspiracy theories.",
        "worldtruth.tv": "This source is widely regarded as a purveyor of fake news and conspiracy theories.",
        "yournewswire.com": "This source is widely regarded as a purveyor of fake news and conspiracy theories.",

        "foxnews.com": "This source has a mixed reputation; some content is credible, but it is also known for bias and occasional misinformation.",
        "msnbc.com": "This source has a mixed reputation; some content is credible, but it is also known for bias and occasional misinformation.",
        "newsweek.com": "This source has a mixed reputation; some content is credible, but it is also known for bias and occasional misinformation.",
        "washingtontimes.com": "This source has a mixed reputation; some content is credible, but it is also known for bias and occasional misinformation.",

        "unknown": "The credibility of this source is unknown or not listed in our database."
    }
    # Try exact match first
    if domain in source_cred:
        return source_cred[domain]
    # Try parent domain match
    for key in source_cred:
        if domain.endswith(key):
            return source_cred[key]
    return "unknown"

def scrape_text(url):
    try:
        art = Article(url)
        art.download()
        art.parse()
        return art.text
    except Exception as e:
        return "Invalid Url"
