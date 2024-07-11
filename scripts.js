document.addEventListener("DOMContentLoaded", () => {
  const CMD_KEY = "/";
  const MENU_HEIGHT = 30;
  const allowedTags = [
    {
      id: "heading",
      tag: "h1",
      title: "Heading 1",
      description: "Shortcut: type # + space",
      icon: "bx bx-text",
    },
    {
      id: "expandable-heading",
      tag: "h2",
      title: "Expandable Heading 1",
      description: "Shortcut: type >># + space",
      icon: "bx bx-text",
    },
  ];

  const rootElement = document.getElementById("root");

  function createEditableBlock(html = "", tag = "p") {
    const block = document.createElement(tag);
    block.contentEditable = true;
    block.className = "Block";
    block.innerHTML = html;
    block.dataset.placeholder = "Type / for blocks, @ to link docs or people"; // Set the default placeholder
    checkPlaceholder(block);
    block.addEventListener("input", () => handleInputChange(block));
    block.addEventListener("keydown", (e) => handleKeyDown(e, block));
    block.addEventListener("focus", () => handleFocus(block));
    block.addEventListener("blur", () => handleBlur(block));
    return block;
  }

  const initialBlock = createEditableBlock();
  rootElement.appendChild(initialBlock);

  function handleKeyDown(e, block) {
    if (e.key === CMD_KEY) {
      block.dataset.htmlBackup = block.innerHTML;
      openSelectMenu(block);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnterKey(block);
    } else if (e.key === "Backspace" && block.innerHTML === "") {
      e.preventDefault();
      handleBackspace(block);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusPreviousBlock(block);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusNextBlock(block);
    }
  }

  function handleInputChange(block) {
    block.dataset.html = block.innerHTML;
    checkPlaceholder(block);

    const text = block.innerText.trim();

    if (text.startsWith(CMD_KEY) && !block.dataset.menuOpened) {
      openSelectMenu(block);
    } else if (!text.startsWith(CMD_KEY) && block.dataset.menuOpened) {
      closeSelectMenu();
    }
  }

  function handleFocus(block) {
    checkPlaceholder(block);
  }

  function handleBlur(block) {
    checkPlaceholder(block);
  }

  function checkPlaceholder(block) {
    const isEmpty = block.textContent.trim() === "";
    if (isEmpty) {
      block.classList.add("Placeholder");
    } else {
      block.classList.remove("Placeholder");
    }
  }

  function handleCommand(block) {
    const text = block.innerText.trim();
    if (text.startsWith(CMD_KEY)) {
      const index = parseInt(text.substring(1, 2)) - 1;
      if (index >= 0 && index < allowedTags.length) {
        const { tag, title } = allowedTags[index];
        const content = text.substring(2).trim();
        const newBlock = createEditableBlock(content, tag);
        newBlock.dataset.placeholder = title;
        block.parentNode.insertBefore(newBlock, block.nextSibling);
        block.remove();
        setCaretToEnd(newBlock);
        closeSelectMenu();
      }
    } else {
      const newBlock = createEditableBlock();
      block.parentNode.insertBefore(newBlock, block.nextSibling);
      newBlock.focus();
    }
  }

  function handleEnterKey(block) {
    handleCommand(block);
  }

  function handleBackspace(block) {
    if (block.innerText.trim() === "") {
      if (block.tagName === "H1") {
        const newBlock = createEditableBlock("", "p");
        block.parentNode.insertBefore(newBlock, block);
        block.remove();
        setCaretToEnd(newBlock);
        newBlock.focus();
      } else {
        const prevBlock = block.previousElementSibling;
        if (prevBlock) {
          block.remove();
          setCaretToEnd(prevBlock);
          prevBlock.focus();
        }
      }
    }
  }

  function openSelectMenu(block) {
    if (document.querySelector(".SelectMenu")) {
      closeSelectMenu();
    }
    block.dataset.menuOpened = true;
    const container = document.querySelector(".container");
    const { x, y } = getCaretCoordinates(container);
    const menu = createSelectMenu(x, y + MENU_HEIGHT, block);
    container.appendChild(menu);
    document.addEventListener("click", () => closeSelectMenu(menu), {
      once: true,
    });
  }
  function createSelectMenu(x, y, block) {
    const menu = document.createElement("div");
    menu.className = "SelectMenu";
    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;

    const itemsContainer = document.createElement("div");
    itemsContainer.className = "Items";

    const infoContainer = document.createElement("div");
    infoContainer.className = "infoContainer";

    const menuTitle = document.createElement("div");
    menuTitle.className = "MenuTitle";
    menuTitle.innerText = "Add blocks";

    const menuDescription = document.createElement("div");
    menuDescription.className = "MenuDescription";
    menuDescription.innerText = "Keep typing to filter, or escape to exit";

    const filteringKeyword = document.createElement("div");
    filteringKeyword.className = "FilteringKeyword";
    filteringKeyword.innerHTML = `Filtering keyword: <span class="FilteringKeywordNumber">1</span>`;

    infoContainer.appendChild(menuTitle);
    infoContainer.appendChild(menuDescription);
    infoContainer.appendChild(filteringKeyword);

    itemsContainer.appendChild(infoContainer);

    allowedTags.forEach((item) => {
      const menuItem = document.createElement("div");
      menuItem.setAttribute("role", "button");
      menuItem.tabIndex = 0;
      menuItem.className = "MenuItem";

      const menuItemIcon = document.createElement("i");
      menuItemIcon.className = `bx ${item.icon} MenuItemIcon`;

      const menuItemContent = document.createElement("div");
      menuItemContent.className = "MenuItemContent";

      const menuItemTitle = document.createElement("div");
      menuItemTitle.className = "MenuItemTitle";
      menuItemTitle.innerText = item.title;

      const menuItemDescription = document.createElement("div");
      menuItemDescription.className = "MenuItemDescription";
      menuItemDescription.innerText = item.description;

      menuItemContent.appendChild(menuItemTitle);
      menuItemContent.appendChild(menuItemDescription);

      menuItem.appendChild(menuItemIcon);
      menuItem.appendChild(menuItemContent);

      menuItem.addEventListener("click", () => handleTagSelection(block, item));

      itemsContainer.appendChild(menuItem);
    });

    menu.appendChild(itemsContainer);
    return menu;
  }

  function handleTagSelection(block, item) {
    if (item.id === "heading") {
      const newBlock = createEditableBlock("", "h1");
      newBlock.dataset.placeholder = "Heading 1";
      block.parentNode.insertBefore(newBlock, block.nextSibling);
      block.remove();
      setCaretToEnd(newBlock);
      closeSelectMenu();
    }
  }

  function closeSelectMenu() {
    const menu = document.querySelector(".SelectMenu");
    if (menu) {
      menu.remove();
    }
    document.querySelectorAll(".Block").forEach((block) => {
      block.removeAttribute("data-menuOpened");
    });
  }

  function getCaretCoordinates(container) {
    let x, y;
    const isSupported = typeof window.getSelection !== "undefined";
    if (isSupported) {
      const selection = window.getSelection();
      if (selection.rangeCount !== 0) {
        const range = selection.getRangeAt(0).cloneRange();
        range.collapse(false);
        const rect = range.getClientRects()[0];
        if (rect) {
          const containerRect = container.getBoundingClientRect();
          x = rect.left - containerRect.left + container.scrollLeft;
          y = rect.top - containerRect.top + container.scrollTop;
        }
      }
    }
    return { x, y };
  }
  function setCaretToEnd(element) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    element.focus();
  }

  function focusPreviousBlock(block) {
    const prevBlock = block.previousElementSibling;
    if (prevBlock && prevBlock.classList.contains("Block")) {
      prevBlock.focus();
      setCaretToEnd(prevBlock);
    }
  }

  function focusNextBlock(block) {
    const nextBlock = block.nextElementSibling;
    if (nextBlock && nextBlock.classList.contains("Block")) {
      nextBlock.focus();
      setCaretToEnd(nextBlock);
    }
  }
});
