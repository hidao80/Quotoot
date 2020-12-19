window.onload = () => {
  // class="item-list" の DIV を監視対象にする
  const itemList = document.querySelectorAll(".item-list");
  const config = {childList: true};

  // レーンのみ監視
  itemList.forEach(list => {
    // 要素の監視
    const observer = new MutationObserver( (mutations,observer) => {
      update(list);
    });

    observer.observe(list, config);
		update(list);	// 起動時はDOMの更新がなくても一通り処理をする
  });
};

/**
 * 当該レーンの中で Qiitadon の toot へのリンクがあったら toot の中で展開する
 * @param {DOM} list
 */
function update(list) {
	list.querySelectorAll(".status__content").forEach(async elem => {
		const instanceFull = "https://qiitadon.com";
		const tootUrl = elem.textContent.match(/https?:\/\/qiitadon.com\/(@.+|web\/statuses)\/(\d+)/);
		//console.log(tootUrl);
		if (tootUrl !== null) {
			const fetchArray = [fetchJsonAndCheck(`${instanceFull}/api/v1/statuses/${tootUrl[2]}`)];
			const toots = await Promise.all(fetchArray);
			toots.forEach(toot => {
				console.log(toot);
				// 展開済みでない場合のみ URL 先の toot を展開して追加する
				if (elem.querySelectorAll(".toot").length == 0) {
					elem.appendChild(createTootDiv(toot));
				}
			});
		}
	});
}

/**
 * URL で指定されたリソースを非同期で取得する
 * @param {string} url
 * @returns {json | null}
 */
async function fetchJsonAndCheck(url) {
	try {
		const r = await fetch(url);
		if (r.ok) {
			return await r.json();
		}
		throw new Error(`Request failed: ${r.status}`);
	} catch (e) {
		console.error(e);
		return null;
	}
}

/**
 * toot を表す json から DOM を作成する
 * @param {*} toot 
 */
function createTootDiv(toot) {
	const tootDiv = document.createElement("div");
	let strContent = toot.content;
	for (const emoji of toot.emojis) {
		strContent = strContent.replace(
			new RegExp(`:${emoji.shortcode}:`, "g"),
			`<img class="emoji" alt=":${emoji.shortcode}:" src="${emoji.url}">`
		);
	}
	const spoiler_text = toot.spoiler_text != undefined ? `<p>${toot.spoiler_text}</p>` : "";
	const blur = toot.sensitive ? "sensitive" : "";
	const contentHtml = document.createElement("div").innerHTML = `<div class='${blur}'>${strContent.trim()}</div>`;
	const media = toot.media_attachments
		.map(attachment => `<p><a href='${attachment.url}' target='_blank' rel='noopener noreferrer'><img class='thumbs ${blur}' src='${attachment.preview_url}'></a></p>`)
		.join("");
	tootDiv.innerHTML = `
<div class="box">
	<a href="${toot.account.url}">
		<img width="48" height="48" alt="avatar" class="inner-u-photo" src="${toot.account.avatar}">
	</a>
	<a class="inner-display-name" href="${toot.account.url}">
		${toot.account.display_name.trim()}
		<!--<span>@${toot.account.username}@${new URL(toot.account.url).hostname}</span>-->
	</a>
	<div class="inner-e-content" lang="ja">
		${spoiler_text}${contentHtml}
	</div>
	${media}
</div>`;
	tootDiv.setAttribute("class", "toot");
	return tootDiv;
}
