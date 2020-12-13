window.onload = () => {
  // class="item-list" の DIV を監視対象にする
  const itemList = document.querySelectorAll(".item-list");
  const config = {childList: true};

  // 一番右のレーンのみ監視
  itemList.forEach(line => {
    // 要素の監視
    const observer = new MutationObserver( (mutations,observer) => {
      update(itemList);
    });

    observer.observe(line, config);
  });

  update(itemList);
};

function update(itemList) {
  itemList.forEach(line => {
    line.querySelectorAll(".status__content").forEach(async elem => {
      const instanceFull = "https://qiitadon.com";
      const tootUrl = elem.textContent.match(/https?:\/\/qiitadon.com\/(@.+|web\/statuses)\/(\d+)/);
      //console.log(tootUrl);
      if (tootUrl !== null) {
        const tootId = tootUrl[2];
        console.log(instanceFull + "/api/v1/statuses/" + tootId);

        const fetchArray = [fetchJsonAndCheck(`${instanceFull}/api/v1/statuses/${tootId}`)];
        const toots = await Promise.all(fetchArray);
        toots
          .filter(toot => toot)
          .forEach(toot => {
            const tootDiv = createTootDiv(toot);
            if (elem.querySelectorAll(".toot").length == 0) {
              elem.appendChild(tootDiv);  
            }
          });
      }
    });
  });
}

/**
 * @param {Request | string} input
 * @returns {Promise<any>}
 */
async function fetchJsonAndCheck(input) {
	try {
		const r = await fetch(input);
		if (r.ok) {
			return await r.json();
		}
		throw new Error(`Request failed: ${r.status}`);
	} catch (e) {
		console.error(e);
		return null;
	}
}

function createTootDiv(toot) {
	const tootDiv = document.createElement("div");
	let strContent = toot.content;
	for (const emoji of toot.emojis) {
		strContent = strContent.replace(
			new RegExp(`:${emoji.shortcode}:`, "g"),
			`<img class="emoji" alt=":${emoji.shortcode}:" src="${emoji.url}">`
		);
	}
	const contentHtml = getHtmlFromContent(strContent);
	const media = toot.media_attachments
		.map(attachment => `<a href='${attachment.url}'><img class='thumbs' src='${attachment.preview_url}'></a>`)
		.join("");
	tootDiv.innerHTML = `
<div class="box">
	<a href="${toot.account.url}">
		<img width="48" height="48" alt="avatar" class="u-photo" src="${toot.account.avatar}">
	</a>
	<a class="display-name" href="${toot.account.url}">
		${toot.account.display_name.trim()}
		<span>@${toot.account.username}@${new URL(toot.account.url).hostname}</span>
	</a>
	<div class="e-content" lang="ja" style="display: block; direction: lt; white-space: unset;">
		<p>${contentHtml}</p>
	</div>
	${media}
</div>`;
tootDiv.setAttribute("class", "toot");
	return tootDiv;
}

function getHtmlFromContent(strContent) {
	const div = document.createElement("div");
  div.innerHTML = strContent.trim();
	return div.innerHTML;
}
