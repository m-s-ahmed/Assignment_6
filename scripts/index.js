// Dom reference

const categoryListEl = document.getElementById("categoryList");
const gridEl = document.getElementById("grid");
const spinnerEl = document.getElementById("spinner");
const cartListEl = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCart");
const detailModal = document.getElementById("detailModal");
const modalContent = document.getElementById("modalContent");

// API url

var API = {
  allPlants: "https://openapi.programming-hero.com/api/plants",
  allCategories: "https://openapi.programming-hero.com/api/categories",
  byCategory: function (id) {
    return "https://openapi.programming-hero.com/api/category/" + id;
  },
  details: function (id) {
    return "https://openapi.programming-hero.com/api/plant/" + id;
  },
};
// fetch(API.allPlants)
// API.byCategory(5);

// Utility function

function showSpinner(show) {
  // show==true
  if (show) {
    spinnerEl.classList.remove("hidden");
    gridEl.innerHTML = "";
  } else {
    spinnerEl.classList.add("hidden");
  }
}

function toNumber(n) {
  return Number(n || 0);
}

// data normalization function
function makeItem(raw) {
  if (!raw) {
    raw = {};
  }
  let id = raw.id;
  if (!id && raw._id) id = raw._id;
  if (!id && raw.plantId) id = raw.plantId;
  if (!id && raw.slug) id = raw.slug;
  if (!id) id = Math.random().toString(36).substring(2);

  return {
    id: id,
    name: raw.name ? raw.name : "Tree",
    price: toNumber(raw.price),
    image: raw.image ? raw.image : "",
    description: raw.description ? raw.description : "",
    category: raw.category ? raw.category : "—",
  };
}

function setActiveCategoryButton(btn) {
  let buttons = categoryListEl.querySelectorAll("button[data-id]");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("btn-success");
    buttons[i].classList.add("btn-ghost");
  }
  if (btn) {
    btn.classList.remove("btn-ghost");
    btn.classList.add("btn-success");
  }
}

// Category load
function loadCategories() {
  showSpinner(true);
  fetch(API.allCategories)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      let list = data && data.categories ? data.categories : [];

      renderOneCategory({ id: "all", category_name: "All Trees" }, true);

      for (let i = 0; i < list.length; i++) {
        renderOneCategory(list[i], false);
      }

      return loadPlants("all");
    })
    .catch(function () {
      categoryListEl.innerHTML =
        '<li class="text-error">Failed to load categories.</li>';
    })
    .finally(function () {
      showSpinner(false);
    });
}

function renderOneCategory(cat, makeActive) {
  var li = document.createElement("li");
  var btn = document.createElement("button");
  btn.setAttribute("data-id", cat.id);
  btn.className = "btn btn-sm btn-ghost justify-start w-full text-left";
  btn.textContent = cat.category_name;

  if (makeActive) {
    btn.classList.remove("btn-ghost");
    btn.classList.add("btn-success");
  }

  btn.addEventListener("click", function () {
    setActiveCategoryButton(btn);
    loadPlants(cat.id);
  });

  li.appendChild(btn);
  categoryListEl.appendChild(li);
}

function loadPlants(categoryId) {
  showSpinner(true);

  var url = API.allPlants;
  if (categoryId !== "all") {
    url = API.byCategory(categoryId);
  }

  return fetch(url)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      var plants = [];
      if (data && data.plants) plants = data.plants;
      else if (data && data.data) plants = data.data;
      renderGrid(plants);
    })
    .catch(function () {
      gridEl.innerHTML = '<p class="text-error">Failed to load plants.</p>';
    })
    .finally(function () {
      showSpinner(false);
    });
}

function renderGrid(list) {
  gridEl.innerHTML = "";
  if (!list || list.length === 0) {
    gridEl.innerHTML =
      '<div class="col-span-full text-center py-10">No trees found.</div>';
    return;
  }

  for (let i = 0; i < list.length; i++) {
    let card = createCard(list[i]);
    gridEl.appendChild(card);
  }
}

function createCard(rawItem) {
  var item = makeItem(rawItem);
  var card = document.createElement("div");

  card.className = "card bg-base-100 shadow hover:shadow-lg transition";

  // image
  var fig = document.createElement("figure");
  fig.className = "bg-base-200 aspect-[4/3] overflow-hidden";
  var img = document.createElement("img");
  img.className = "h-full w-full object-cover";
  img.alt = item.name;
  img.src = item.image ? item.image : "Image Not Found";
  fig.appendChild(img);
  card.appendChild(fig);

  // body
  var body = document.createElement("div");
  body.className = "card-body";

  var nameEl = document.createElement("h3");
  nameEl.className = "font-semibold text-lg hover:underline cursor-pointer";
  nameEl.textContent = item.name;
  nameEl.addEventListener("click", function () {
    openDetails(item);
  });

  let descEl = document.createElement("p");
  descEl.className = "text-sm text-base-content/70 line-clamp-2";
  descEl.textContent = item.description
    ? item.description
    : "No description available.";

  let metaRow = document.createElement("div");
  metaRow.className = "flex items-center gap-2 mt-1";
  let catBadge = document.createElement("span");
  catBadge.className = "badge badge-outline";
  catBadge.textContent = item.category;

  let priceWrap = document.createElement("span");
  priceWrap.className = "ml-auto font-semibold";
  priceWrap.innerHTML = "৳<span>" + item.price + "</span>";
  metaRow.appendChild(catBadge);
  metaRow.appendChild(priceWrap);

  var actions = document.createElement("div");
  actions.className = "card-actions mt-3";
  var addBtn = document.createElement("button");
  addBtn.className = "btn btn-success btn-sm w-full";
  addBtn.textContent = "Add to Cart";
  addBtn.addEventListener("click", function () {
    addToCart(item);
  });
  actions.appendChild(addBtn);

  body.appendChild(nameEl);
  body.appendChild(descEl);
  body.appendChild(metaRow);
  body.appendChild(actions);
  card.appendChild(body);

  return card;
}

// ------------------------------
//-------------------------------

// Modals Creation

function openDetails(listItem) {
  let base = makeItem(listItem);

  detailModal.showModal();
  modalContent.innerHTML =
    '<div class="py-6 text-center"><span class="loading loading-dots loading-lg"></span></div>';

  if (!base.id) {
    renderModal(base);
    return;
  }

  fetch(API.details(base.id))
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      let p = data && (data.plant || data.data) ? data.plant || data.data : {};
      let merged = makeItem(simpleMerge(base, p));
      renderModal(merged);
    })
    .catch(function () {
      renderModal(base);
    });
}

function simpleMerge(a, b) {
  var out = {};

  for (var k in a) {
    if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
  }

  for (var k2 in b) {
    if (Object.prototype.hasOwnProperty.call(b, k2)) out[k2] = b[k2];
  }
  return out;
}

function renderModal(pItem) {
  var p = makeItem(pItem);
  var html =
    "" +
    '<div class="flex flex-col sm:flex-row gap-5">' +
    ' <img class="w-full sm:w-64 h-48 object-cover rounded" src="' +
    (p.image ? p.image : "https://picsum.photos/seed/details/600/400") +
    '" alt="' +
    p.name +
    '" />' +
    " <div>" +
    ' <h3 class="text-2xl font-semibold">' +
    p.name +
    "</h3>" +
    ' <p class="mt-1 text-sm opacity-70">' +
    (p.description ? p.description : "No description found.") +
    "</p>" +
    ' <div class="mt-2 flex items-center gap-2">' +
    ' <span class="badge badge-outline">' +
    p.category +
    "</span>" +
    ' <span class="ml-auto font-bold">৳' +
    p.price +
    "</span>" +
    " </div>" +
    ' <button class="btn btn-success btn-sm mt-3" id="modalAdd">Add to Cart</button>' +
    " </div>" +
    "</div>";

  modalContent.innerHTML = html;

  var addBtn = document.getElementById("modalAdd");
  if (addBtn) {
    addBtn.addEventListener("click", function () {
      addToCart(p);
      detailModal.close();
    });
  }
}

// ------------------------------
//-------------------------------

// Cart()

let cartItems = [];

function findCartIndex(id) {
  for (let i = 0; i < cartItems.length; i++) {
    if (cartItems[i].id === id) return i;
  }
  return -1;
}

function addToCart(rawItem) {
  let item = makeItem(rawItem);
  let idx = findCartIndex(item.id);

  if (idx === -1) {
    cartItems.push({
      id: item.id,
      name: item.name,
      price: toNumber(item.price),
      qty: 1,
    });
  } else {
    cartItems[idx].qty += 1;
  }
  renderCart();
}

function removeFromCart(id) {
  let index = findCartIndex(id);
  if (index !== -1) {
    cartItems.splice(index, 1);
    renderCart();
  }
}

function findCartIndex(id) {
  for (let i = 0; i < cartItems.length; i++) {
    if (cartItems[i].id === id) return i;
  }
  return -1;
}

function calcTotal() {
  var sum = 0;
  for (var i = 0; i < cartItems.length; i++) {
    sum = sum + cartItems[i].price * cartItems[i].qty;
  }
  return sum;
}

function renderCart() {
  cartListEl.innerHTML = "";
  if (cartItems.length === 0) {
    cartListEl.innerHTML = '<li class="text-sm opacity-70">Cart is empty.</li>';
    cartTotalEl.textContent = "0";
    return;
  }

  for (let i = 0; i < cartItems.length; i++) {
    let item = cartItems[i];
    let li = document.createElement("li");
    li.className = "flex items-center gap-2";
    li.innerHTML =
      "" +
      '<div class="flex-1">' +
      ' <div class="font-medium">' +
      item.name +
      "</div>" +
      ' <div class="text-xs opacity-70">৳' +
      item.price +
      " × " +
      item.qty +
      "</div>" +
      "</div>" +
      '<button class="btn btn-xs btn-ghost">✕</button>';

    // remove button
    li.querySelector("button").addEventListener(
      "click",
      (function (id) {
        return function () {
          removeFromCart(id);
        };
      })(item.id)
    );

    cartListEl.appendChild(li);
  }

  cartTotalEl.textContent = calcTotal();
}

clearCartBtn.addEventListener("click", function () {
  cartItems = [];
  renderCart();
});

// Let's Start

loadCategories();
