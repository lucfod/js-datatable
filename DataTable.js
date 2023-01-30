var gbl_cacheDataTable = [];

function DataTable(p_id, p_settings) {
  var v_defaults = {
    nowrap: false,
    searchable: false,
    exportable: false,
    filterable: false,
    filterColumns: [],
    sortable: false,
    pageable: false,
    infoable: false,
    hideHeaders: false,
    clearTable: false,
    perPage: 10,
    perPageSelect: [5, 10, 25, 50, 100],
    truncatePager: true,
    pagerDelta: 2,

    containerStyle: "",
    tableClass: "",
    clickClass: "",

    captionClass: "",
    headerClass: "",
    footerClass: "",
  };

  this._table = document.getElementById(p_id);
  this._tHead = this._table.tHead;
  this._tHeadRows = this._tHead.rows[0];
  this._tBody = this._table.tBodies[0];
  this._currentPage = 1;
  this._onFirstPage = true;
  this._settings = Util.Extend(v_defaults, p_settings);
  this._isIE = !!/(msie|trident)/i.test(navigator.userAgent);

  // variable "_this" is used for add function in Util.listen,
  // if you use "this" word inside function don't have datatable object.
  var v_this = this;

  this._cacheDataTable = gbl_cacheDataTable.filter(function (x) {
    return x.tableId == v_this._table.id;
  })[0];

  if (this._cacheDataTable == undefined) {
    this._cacheDataTable = {
      tableId: this._table.id,
      searchText: "",
      scrollTop: 0,
      filters: [],
      page: 0,
    };
    gbl_cacheDataTable.push(this._cacheDataTable);
  }

  this.search = function (p_text) {
    var _this = this;
    this._currentPage = 1;
    this._searching = true;
    this._searchData = [];

    p_text = p_text.toLowerCase();

    this._cacheDataTable.searchText = p_text;

    if (!p_text.length) {
      this._searching = false;
      this.update();
      return;
    }

    this.clear();

    Util.Each(this._rows, function (i, row) {
      var inArray = Util.Includes(_this._searchData, row);
      // Cheat and get the row's textContent instead of searching each cell :P
      if (Util.Includes(row.textContent.toLowerCase(), p_text) && !inArray) {
        _this._searchData.push(row);
      }
    });

    if (!this._searchData.length) {
      this.setMessage("Records not found");
    }

    this.update();
  };

  this.filterItems = function () {
    var _this = this;
    this._currentPage = 1;
    this._searching = true;
    this._searchData = [];

    var v_filterCells = this._tHeadRows.cells;

    var v_filters = [],
      v_filter = null,
      v_filterId = null,
      v_filterValue = null,
      v_filterSource = null;

    Util.Each(v_filterCells, function (j, cell) {
      v_filter = cell.getElementsByTagName("select")[0];
      if (v_filter) {
        v_filterId = v_filter.id;
        v_filterValue = v_filter.value;

        if (v_filterValue != undefined && v_filterValue != "") {
          v_filters.push({
            id: v_filterId,
            value: v_filterValue,
            col: j,
          });
        }
      }
    });

    this._cacheDataTable.filters = v_filters;

    if (v_filters.length == 0) {
      this._searching = false;
      this.update();
      return;
    }

    this.clear();

    Util.Each(this._rows, function (i, row) {
      var inArray = Util.Includes(_this._searchData, row);

      Util.Each(v_filters, function (j, filter) {
        if (navigator.userAgent.indexOf("Firefox") != -1) {
          v_filterSource = row.cells[filter.col].innerHTML;
        } else {
          v_filterSource = row.cells[filter.col].innerText;
        }

        if (v_filterSource == filter.value && !inArray) {
          _this._searchData.push(row);
        }
      });
    });

    this.update();
  };

  this.sortColumn = function (p_column) {
    // variable "_this" is used for add function in Util.listen,
    // if you use "this" word inside function don't have datatable object.
    var _this = this;
    var v_dir;
    var v_rows = this._searching ? this._searchData : this._rows;
    var v_alpha = [];
    var v_numeric = [];
    var a = 0;
    var n = 0;
    var v_th = this._tHeadRows.cells[p_column];

    Util.Each(v_rows, function (i, tr) {
      var cell = tr.cells[v_th.idx];
      var content = cell.textContent;
      var num = content.replace(/(\$|\,|\s)/g, "");

      if (parseFloat(num) == num) {
        v_numeric[n++] = { value: Number(num), row: tr };
      } else {
        v_alpha[a++] = { value: content, row: tr };
      }
    });

    /* Sort according to direction (ascending or descending) */
    var v_top, v_btm;
    if (Util.HasClass(v_th, "asc")) {
      v_top = this.sortItems(v_alpha, -1);
      v_btm = this.sortItems(v_numeric, -1);
      v_dir = "descending";
      Util.RemoveClass(v_th, "asc");
      Util.AddClass(v_th, "desc");
    } else {
      v_top = this.sortItems(v_numeric, 1);
      v_btm = this.sortItems(v_alpha, 1);
      v_dir = "ascending";
      Util.RemoveClass(v_th, "desc");
      Util.AddClass(v_th, "asc");
    }

    /* Clear asc/desc class names from the last sorted column's th if it isn't the same as the one that was just clicked */
    if (this._lastTh && v_th != this._lastTh) {
      Util.RemoveClass(this._lastTh, "desc");
      Util.RemoveClass(this._lastTh, "asc");
    }

    this._lastTh = v_th;

    /* Reorder the table */
    v_rows = v_top.concat(v_btm);

    if (this._searching) {
      this._searchData = [];

      Util.Each(v_rows, function (i, v) {
        _this._searchData.push(v.row);
      });
    } else {
      this._rows = [];

      Util.Each(v_rows, function (i, v) {
        _this._rows.push(v.row);
      });
    }

    this.update();
  };

  this.sortItems = function (a, b) {
    var c, d;
    if (1 === b) {
      c = 0;
      d = a.length;
    } else {
      if (b === -1) {
        c = a.length - 1;
        d = -1;
      }
    }

    for (var e = !0; e; ) {
      e = !1;

      for (var f = c; f != d; f += b) {
        if (a[f + b] && a[f].value > a[f + b].value) {
          var g = a[f],
            h = a[f + b],
            i = g;
          a[f] = h;
          a[f + b] = i;
          e = !0;
        }
      }
    }
    return a;
  };

  this.exportExcel = function () {
    var v_dataType = "application/vnd.ms-excel";
    var v_tableHTML = "<table>";

    this._table
      .querySelectorAll("tr:not(.dt-tr-header-hidden):not(.dt-tr-hidden)")
      .forEach(function (p_row) {
        v_tableHTML += "<tr>";
        p_row
          .querySelectorAll("td:not(.dt-td-hidden)")
          .forEach(function (p_cell) {
            v_tableHTML += "<td>" + p_cell.innerHTML + "</td>";
          });
        v_tableHTML += "</tr>";
      });

    v_tableHTML += "</table>";
    //tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');
    v_tableHTML = v_tableHTML.replace(/<div[^>]*>|<\/div>/gi, ""); // remove if u want divs in your table
    v_tableHTML = v_tableHTML.replace(/<A[^>]*>|<\/A>/gi, ""); // remove if u want links in your table
    v_tableHTML = v_tableHTML.replace(/<span[^>]*>|<\/span>/gi, ""); // remove if u want spans in your table
    v_tableHTML = v_tableHTML.replace(/<img[^>]*>/gi, ""); // remove if u want images in your table
    v_tableHTML = v_tableHTML.replace(/<input[^>]*>|<\/input>/gi, ""); // remove if u want unputs in your table

    var v_filename = "excel_data.xls";

    if (navigator.msSaveOrOpenBlob) {
      var v_blob = new Blob(["\ufeff", v_tableHTML], {
        type: v_dataType,
      });
      navigator.msSaveOrOpenBlob(v_blob, v_filename);
    } else {
      window.open("data:" + v_dataType + "," + escape(v_tableHTML));
    }
  };

  this.setMessage = function (p_message) {
    var v_colspan = this._table._tHeadRows.cells.length;
    this.clear(
      Util.CreateElement("tr", {
        html:
          '<td class="datatable-empty" colspan="' +
          v_colspan +
          '">' +
          p_message +
          "</td>",
      })
    );
  };

  this.update = function () {
    this.paginate();
    this.render();

    this._links = [];
    var i = this._pages.length;

    while (i--) {
      var num = i + 1;
      this._links[i] = Util.CreateElement("li", {
        class: i === 0 ? "active" : "",
        html: '<a href="#" data-page="' + num + '">' + num + "</a>",
      });
    }

    this.renderPager();
  };

  this.paginate = function () {
    var v_perPage = this._settings.pageable
      ? this._settings.perPage
      : this._rows.length;
    var v_rows = this._searching ? this._searchData : this._rows;

    this._pages = v_rows
      .map(function (tr, i) {
        return i % v_perPage === 0 ? v_rows.slice(i, i + v_perPage) : null;
      })
      .filter(function (page) {
        return page;
      });

    this._totalPages = this._lastPage = this._pages.length;
  };

  this.render = function () {
    if (this._totalPages) {
      if (this._currentPage > this._totalPages) {
        this._currentPage = 1;
      }

      // Use a fragment to limit touching the DOM
      var index = this._currentPage - 1;
      var v_frag = Util.CreateFragment();

      Util.Each(this._pages[index], function (i, v) {
        Util.Append(v_frag, v);
      });

      this.clear(v_frag);
      this._onFirstPage = false;
      this._onLastPage = false;

      switch (this._currentPage) {
        case 1:
          this._onFirstPage = true;
          break;
        case this._lastPage:
          this._onLastPage = true;
          break;
      }
    }

    // Update the info
    if (this._settings.infoable) {
      var v_items = this._searching
        ? this._searchData.length
        : this._rows.filter(function (x) {
            return !Util.HasClass(x, "tr-hidden");
          }).length;
      v_items = v_items < 0 ? 0 : v_items;

      if (this._totalPages > 1) {
        this._infoItems.innerHTML = [
          v_items,
          " items",
          " en ",
          this._totalPages,
          " páginas",
        ].join("");
      } else {
        this._infoItems.innerHTML = [v_items, " items"].join("");
      }
    }
  };

  this.renderPager = function () {
    if (this._settings.pageable) {
      Util.Flush(this._paginator, this._isIE);

      if (this._totalPages <= 1) return;

      var c = "pager";
      var v_frag = Util.CreateFragment();
      var v_prev = this._onFirstPage ? 1 : this._currentPage - 1;
      var v_next = this._onLastPage ? this._totalPages : this._currentPage + 1;

      // paging - firstPrev
      Util.Append(
        v_frag,
        Util.CreateElement("li", {
          class: c,
          html: '<a href="#" data-page="1">&laquo;</a>',
        })
      );
      Util.Append(
        v_frag,
        Util.CreateElement("li", {
          class: c,
          html: '<a href="#" data-page="' + v_prev + '">&lsaquo;</a>',
        })
      );

      var v_pager = this._links;

      // truncate the links
      if (this._settings.truncatePager) {
        v_pager = this.truncatePager(
          this._links,
          this._currentPage,
          this._pages.length,
          this._settings.pagerDelta
        );
      }

      // active page link
      Util.AddClass(this._links[this._currentPage - 1], "active");

      // append the links
      Util.Each(v_pager, function (i, p) {
        Util.RemoveClass(p, "active");
        Util.Append(v_frag, p);
      });

      Util.AddClass(this._links[this._currentPage - 1], "active");

      // paging - lastNext
      Util.Append(
        v_frag,
        Util.CreateElement("li", {
          class: c,
          html: '<a href="#" data-page="' + v_next + '">&rsaquo;</a>',
        })
      );
      Util.Append(
        v_frag,
        Util.CreateElement("li", {
          class: c,
          html: '<a href="#" data-page="' + this._totalPages + '">&raquo;</a>',
        })
      );

      // append the fragment
      Util.Append(this._paginator, v_frag);
    }
  };

  this.truncatePager = function (a, b, c, d) {
    d = d || 2;
    var j,
      e = 2 * d,
      f = b - d,
      g = b + d,
      h = [],
      i = [];

    if (b < 4 - d + e) {
      g = 3 + e;
    } else if (b > c - (3 - d + e)) {
      f = c - (2 + e);
    }

    for (var k = 1; k <= c; k++) {
      if (1 == k || k == c || (k >= f && k <= g)) {
        var l = a[k - 1];
        Util.RemoveClass(l, "active");
        h.push(l);
      }
    }

    Util.Each(h, function (b, c) {
      var d = c.children[0].getAttribute("data-page");
      if (j) {
        var e = j.children[0].getAttribute("data-page");
        if (d - e == 2) i.push(a[e]);
        else if (d - e != 1) {
          var f = Util.CreateElement("li", {
            class: "ellipsis",
            html: "<span>&hellip;</span>",
          });
          i.push(f);
        }
      }
      i.push(c);
      j = c;
    });

    return i;
  };

  this.changePage = function (p_page) {
    // We don't want to load the current page again.
    if (p_page == this._currentPage) {
      return;
    }

    if (!isNaN(p_page)) {
      this._currentPage = parseInt(p_page, 10);
      this._cacheDataTable.page = parseInt(p_page, 10);
    }

    if (p_page > this._pages.length || p_page < 0) {
      return;
    }

    this.render();
    this.renderPager();
  };

  this.refresh = function () {
    this._inputSearch.value = "";
    this._searching = false;
    this.update();
  };

  this.clear = function (p_html) {
    var v_tBody = this._tBody;

    if (v_tBody) {
      Util.Flush(v_tBody, this._isIE);
    }

    var v_parent = v_tBody;
    if (!v_tBody) {
      v_parent = this._table;
    }

    if (p_html) {
      Util.Append(v_parent, p_html);
    }
  };

  this.scroll = function () {
    // variable "_this" is used for add function in Util.listen,
    // if you use "this" word inside function don't have datatable object.
    //var _this = this;
    var v_headCells = this._tHeadRows.cells;
    var v_scrollTop = this._divContainer.scrollTop;
    var v_scrollLeft = this._divContainer.scrollLeft;
    var v_left = v_scrollLeft != 0 ? "-" + v_scrollLeft : v_scrollLeft;

    for (var i = 0; i < v_headCells.length; i++) {
      //v_headCells[i].firstChild.setAttribute("style", "margin-left: " + v_left + "px");
      v_headCells[i].firstChild.style.marginLeft = v_left + "px";
    }

    this._cacheDataTable.scrollTop = v_scrollTop;
  };

  this.fixHeight = function () {
    var v_height = this._divWrapper.offsetHeight;

    if (this._settings.filterable)
      this._divFixedHeader.style.height =
        this._divFixedHeader.offsetHeight * 2 + "px";

    if (this._divTop || this._divBottom) {
      if (this._divTop) {
        v_height = v_height - this._divTop.offsetHeight;
      }

      if (this._divBottom) {
        v_height = v_height - this._divBottom.offsetHeight;
      }

      this._divMain.style.height = v_height + "px";

      this._divContainer.style.height =
        v_height - this._divFixedHeader.offsetHeight + "px";
    } else {
      this._divContainer.style.height =
        v_height == 0
          ? "auto"
          : v_height - this._divFixedHeader.clientHeight + "px";
    }
  };

  this.buildTable = function () {
    // variable "_this" is used when add function like Util.listen or Util.each or foreach.,
    // if you use "this" word inside function don't have datatable object.
    var _this = this;
    var v_parentNode = this._table.parentNode;
    var v_headerCells = this._tHead.rows[0].cells;
    var v_bodyRows = this._tBody.rows;
    var v_caption;

    // Add class
    Util.AddClass(this._table, "datatable-table");

    if (this._settings.nowrap) {
      this._table.setAttribute("style", "white-space: nowrap");
    }

    if (this._settings.hideHeaders) {
      Util.AddClass(this._tHead.rows[0], "dt-tr-hidden");
    }

    if (this._settings.clearTable) {
      if (v_parentNode) {
        if (v_parentNode.getAttribute("style")) {
          v_parentNode.style.border = "none";
          v_parentNode.style.width = "auto";
          v_parentNode.style.height = "auto";
        } else {
          v_parentNode.setAttribute(
            "style",
            "border: none; width: auto; height: auto;"
          );
        }
      }

      for (var h = 0; h < v_bodyRows.length; h++) {
        Util.AddClass(v_bodyRows[h], "dt-tr-clear");
      }
    }

    Util.Each(v_headerCells, function (idx, headCell) {
      headCell.idx = idx;

      Util.ReplaceClass(headCell, "dt-td-header");

      // div contains elements to fixed header
      var v_divHeadCell = Util.CreateElement("div", {
        class: "dt-head",
        html: headCell.innerHTML,
      });

      Util.AddClass(
        v_divHeadCell,
        _this._settings.headerClass != ""
          ? _this._settings.headerClass
          : _this._settings.tableClass
      );

      headCell.innerHTML = "";
      Util.Append(headCell, v_divHeadCell);

      if (!_this._settings.hideHeaders && !_this._settings.clearTable) {
        // Sortable
        if (_this._settings.sortable) {
          var v_link = Util.CreateElement("a", {
            href: "#",
            class: "datatable-sorter",
            title: "Sort",
          });
          var v_span = Util.CreateElement("span", {
            class: "dt-sorter-text",
            html: v_divHeadCell.innerHTML,
          });
          var v_span_sorter = Util.CreateElement("span", {
            class: "dt-sorter",
          });

          Util.Listen(v_link, "click", function (e) {
            _this.sortColumn(idx);
            Util.PreventDefault(e);
          });

          v_divHeadCell.innerHTML = "";

          Util.Append(v_link, v_span);
          Util.Append(v_link, v_span_sorter);
          Util.Append(v_divHeadCell, v_link);
        }

        // Filterable
        if (_this._settings.filterable) {
          if (
            Util.Includes(_this._settings.filterColumns, idx + 1) ||
            _this._settings.filterColumns.length == 0
          ) {
            var v_divFilter = Util.CreateElement("div", {
              class: "dt-head-filter",
            });
            var v_selectFilter = Util.CreateElement("select", {
              id: "dt_filter_" + _this._table.id + "_" + idx,
              class: "dt-filter",
            });
            var v_filterOptionsValues = [];

            Util.Append(
              v_selectFilter,
              Util.CreateElement("option", { value: "", html: "" })
            );
            v_selectFilter.value = "";

            for (var y = 0; y < _this._tBody.rows.length; y++) {
              var v_bdRow = _this._tBody.rows[y];
              var v_bdCell = v_bdRow.cells[idx];
              var v_value = v_bdCell.innerText;

              if (
                !Util.Includes(v_filterOptionsValues, v_value) &&
                v_value != "" &&
                v_bdCell.innerHTML != "&nbsp;"
              ) {
                v_filterOptionsValues.push(v_value);
                var v_filterOption = Util.CreateElement("option", {
                  value: v_value,
                  html: v_value,
                });

                if (
                  _this._cacheDataTable.filters.filter(function (f) {
                    return f.id == v_selectFilter.id && f.value == v_value;
                  })[0] != undefined
                ) {
                  v_filterOption.selected = true;
                  v_selectFilter.value = v_value;
                }

                Util.Append(v_selectFilter, v_filterOption);
              }
            }

            Util.Listen(v_selectFilter, "change", function (e) {
              _this.filterItems();
            });

            Util.Append(v_divFilter, v_selectFilter);
            Util.Append(v_divHeadCell, v_divFilter);
          }
        }
      }
    });

    if (!this._settings.hideHeaders) {
      var v_hdrRowClone = this._tHead.rows[0].cloneNode(true);
      this._tHead.appendChild(v_hdrRowClone);
      Util.AddClass(v_hdrRowClone, "dt-tr-header-hidden");
    }

    if (!document.getElementById("dtWrapper_" + this._table.id)) {
      this._divWrapper = Util.CreateElement("div", {
        id: "dtWrapper_" + this._table.id,
        class: "datatable-wrapper",
      });
      this._divMain = Util.CreateElement("div", {
        id: "dtMain_" + this._table.id,
        class: "datatable-main",
      });
      this._divFixedHeader = Util.CreateElement("div", {
        id: "dtFixedHeader_" + this._table.id,
        class: "datatable-fixed-header",
      });
      this._divContainer = Util.CreateElement("div", {
        id: "dtContainer_" + this._table.id,
        class: "datatable-container",
      });

      Util.AddClass(
        this._divFixedHeader,
        this._settings.headerClass != ""
          ? this._settings.headerClass
          : this._settings.tableClass
      );
      Util.AddClass(
        this._divFixedHeader,
        this._settings.clearTable ? "dt-clear" : ""
      );

      if (
        this._settings.caption ||
        this._settings.searchable ||
        this._settings.exportable
      ) {
        this._divTop = Util.CreateElement("div", {
          id: "dtTop_" + this._table.id,
          class: "datatable-top",
        });

        Util.AddClass(
          this._divTop,
          this._settings.captionClass != ""
            ? this._settings.captionClass
            : this._settings.tableClass
        );

        // Caption
        if (this._settings.caption) {
          var divCaption = Util.CreateElement("div", {
            id: "dtCaption_" + this._table.id,
            class: "datatable-caption",
            html: v_caption,
          });
          Util.Append(this._divTop, divCaption);
        }

        // Searchable
        if (this._settings.searchable) {
          var v_divSearch = Util.CreateElement("div", {
            id: "dtSearch_" + this._table.id,
            class: "datatable-search",
          });
          this._inputSearch = Util.CreateElement("input", {
            type: "text",
            class: "datatable-input",
            placeholder: "Buscar...",
          });

          Util.Append(v_divSearch, this._inputSearch);
          Util.Append(this._divTop, v_divSearch);

          Util.Listen(this._inputSearch, "keyup", function (e) {
            //console.log(e.target.value);
            _this.search(e.target.value);
          });
        }

        // Exportable
        if (this._settings.exportable) {
          var v_divExport = Util.CreateElement("div", {
            id: "dtExport_" + this._table.id,
            class: "datatable-export",
          });
          var v_linkExport = Util.CreateElement("a", {
            href: "#",
            title: "Exportar Excel",
          });
          var v_imgExport = Util.CreateElement("i", {
            class: "datatable-excel",
          });

          Util.Append(v_linkExport, v_imgExport);
          Util.Append(v_divExport, v_linkExport);
          Util.Append(this._divTop, v_divExport);

          Util.Listen(v_linkExport, "click", function (e) {
            _this.exportExcel();
            Util.PreventDefault(e);
          });
        }
      }

      if (this._settings.pageable || this._settings.infoable) {
        this._divBottom = Util.CreateElement("div", {
          id: "dtBottom_" + this._table.id,
          class: "datatable-bottom",
        });
        var v_divInfo = Util.CreateElement("div", {
          id: "dtInfo_" + this._table.id,
          class: "datatable-info",
        });

        Util.AddClass(
          this._divBottom,
          this._settings.footerClass != ""
            ? this._settings.footerClass
            : this._settings.tableClass
        );
        Util.AddClass(
          v_divInfo,
          this._settings.footerClass != ""
            ? this._settings.footerClass
            : this._settings.tableClass
        );

        // Paginator
        if (this._settings.pageable) {
          var v_divPagination = Util.CreateElement("div", {
            id: "dtPagination_" + this._table.id,
            class: "datatable-pagination",
          });
          this._paginator = Util.CreateElement("ul");

          Util.AddClass(
            v_divPagination,
            this._settings.footerClass != ""
              ? this._settings.footerClass
              : this._settings.tableClass
          );

          Util.Append(v_divPagination, this._paginator);
          Util.Append(this._divBottom, v_divPagination);

          // Switch pages
          Util.Listen(this._paginator, "click", function (e) {
            var t = e.target;
            if (t.nodeName.toLowerCase() === "a") {
              if (t.hasAttribute("data-page")) {
                _this.changePage(t.getAttribute("data-page"));
              }
            }
            Util.PreventDefault(e);
          });

          // Selector
          var v_label = Util.CreateElement("label", {
            class: "datatable-select",
          });
          var v_select = Util.CreateElement("select", {
            class: "datatable-selector",
          });

          Util.Each(this._settings.perPageSelect, function (i, val) {
            Util.Append(
              v_select,
              Util.CreateElement("option", { value: val, html: val })
            );
          });

          v_select.value = this._settings.perPage;

          Util.Append(v_label, v_select);
          v_label.insertAdjacentHTML("afterbegin", " Tamaño página");

          // Change per page
          Util.Listen(v_select, "change", function (e) {
            //console.log(e.target.value);
            _this._settings.perPage = parseInt(e.target.value, 10);
            _this.update();
          });

          Util.Append(v_divInfo, v_label);
        }

        if (this._settings.infoable) {
          // Info Items
          this._infoItems = Util.CreateElement("span");

          Util.Append(v_divInfo, this._infoItems);
        }

        Util.Append(this._divBottom, v_divInfo);
      }

      // Append the containers
      if (
        this._settings.caption ||
        this._settings.searchable ||
        this._settings.exportable
      ) {
        Util.Append(this._divWrapper, this._divTop);
      }

      if (!this._settings.hideHeaders) {
        Util.Append(this._divMain, this._divFixedHeader);
      }

      Util.Append(this._divMain, this._divContainer);
      Util.Append(this._divWrapper, this._divMain);

      if (this._settings.pageable || this._settings.infoable) {
        Util.Append(this._divWrapper, this._divBottom);
      }

      if (v_parentNode && this._settings.containerStyle != "") {
        v_parentNode.setAttribute(
          "style",
          v_parentNode.getAttribute("style") +
            ";" +
            this._settings.containarStyle
        );
      }

      // Insert the main container
      this._table.insertAdjacentElement("beforebegin", this._divWrapper);

      // Populate table container
      Util.Append(this._divContainer, this._table);

      this._rows = Array.prototype.slice.call(this._tBody.rows);

      this.update();

      if (this._settings.searchable) {
        if (this._cacheDataTable.searchText != "") {
          this._inputSearch.value = this._cacheDataTable.searchText;
          this.search(this._cacheDataTable.searchText);
        }
      }

      if (this._settings.filterable) {
        if (this._cacheDataTable.filters.length != 0) {
          this.filterItems();
        }
      }

      if (this._settings.pageable) {
        if (this._cacheDataTable.page != 0) {
          this.changePage(this._cacheDataTable.page);
        }
      }

      // Fixed height
      this.fixHeight();

      if (this._cacheDataTable.scrollTop != 0) {
        this._divContainer.scrollTop = this._cacheDataTable.scrollTop;
      }

      Util.Listen(this._divContainer, "scroll", function (e) {
        _this.scroll();
      });
    }
  };

  this.buildTable();
}
