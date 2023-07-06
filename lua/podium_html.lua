local P = require("podium")

local html = P.PodiumBackend.new({
  preamble = function(element)
    return {}
  end,
  postamble = function(element)
    return {}
  end,
  head1 = function(element)
    local nl = P.guessNewline(element.source)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ value = "<h1 id=\"data-source-line-" .. row .. "\">", kind = "text" }) },
    P.splitTokens(element:sub((element:find("%s"))):trim()),
    { element:clone({ value = "</h1>" .. nl, kind = "text" }) }
    )
  end,
  head2 = function(element)
    local nl = P.guessNewline(element.source)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ value = "<h2 id=\"data-source-line-" .. row .. "\">", kind = "text" }) },
    P.splitTokens(element:sub((element:find("%s"))):trim()),
    { element:clone({ value = "</h2>" .. nl, kind = "text" }) }
    )
  end,
  head3 = function(element)
    local nl = P.guessNewline(element.source)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ value = "<h3 id=\"data-source-line-" .. row .. "\">", kind = "text" }) },
    P.splitTokens(element:sub((element:find("%s"))):trim()),
    { element:clone({ value = "</h3>" .. nl, kind = "text" }) }
    )
  end,
  head4 = function(element)
    local nl = P.guessNewline(element.source)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ value = "<h4 id=\"data-source-line-" .. row .. "\">", kind = "text" }) },
    P.splitTokens(element:sub((element:find("%s"))):trim()),
    { element:clone({ value = "</h4>" .. nl, kind = "text" }) }
    )
  end,
  paragraph = function(element)
    local nl = P.guessNewline(element.source)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ value = "<p id=\"data-source-line-" .. row .. "\">", kind = "text" }) },
    P.splitTokens(element:trim()),
    { element:clone({ value = "</p>" .. nl, kind = "text" }) }
    )
  end,
  over = function(element)
    local nl = P.guessNewline(element.source)
    local row = P.indexToRowCol(element.source, element.startIndex)
    if element.extraProps.listStyle == "ordered" then
      return {
        element:clone({ value = "<ol id=\"data-source-line-" .. row .. "\">" .. nl, kind = "text" }),
      }
    else
      return {
        element:clone({ value = "<ul id=\"data-source-line-" .. row .. "\">" .. nl, kind = "text" }),
      }
    end
  end,
  back = function(element)
    local ld = element.extraProps.listDepth
    local nl = P.guessNewline(element.source)
    local row = P.indexToRowCol(element.source, element.startIndex)
    if element.extraProps.listStyle == "ordered" then
      return {
        element:clone({ value = "</ol>", kind = "text" }),
        element:clone({ value = (ld == 1 and nl or ""), kind = "text" }),
      }
    else
      return {
        element:clone({ value = "</ul>", kind = "text" }),
        element:clone({ value = (ld == 1 and nl or ""), kind = "text" }),
      }
    end
  end,
  cut = function(element)
    return {}
  end,
  pod = function(element)
    return {}
  end,
  verbatim = function(element)
    local nl = P.guessNewline(element.source)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return {
      element:clone({ value = "<pre id=\"data-source-line-" .. row .. "\"><code>", kind = "text" }),
      element:clone({ kind = "text" }),
      element:clone({ kind = "backspace", extraProps = { deleteCount = 1 } }),
      element:clone({ value = "</code></pre>" .. nl, kind = "text" }),
    }
  end,
  html = function(element)
    local _, startIndex, endIndex, _ = P.findDataParagraph(element)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return { element:sub(startIndex, endIndex):clone({ kind = "text" }) }
  end,
  item = function(element)
    local nl = P.guessNewline(element.source)
    local _, startIndex = element:find("^=item%s*[*0-9]*%.?.")
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ kind = "text", value = "<li id=\"data-source-line-" .. row .. "\">" }) },
    P.splitItem(element:sub(startIndex):trim()),
    { element:clone({ kind = "text", value = "</li>" .. nl }) }
    )
  end,
  ["for"] = function(element)
    local nl = P.guessNewline(element.source)
    local _, startIndex = element:find("^=for%s+%S+%s")
    local row = P.indexToRowCol(element.source, element.startIndex)
    return {
      element:clone({ kind = "text", value = "<pre id=\"data-source-line-" .. row .. "\"><code>" .. nl }),
      element:sub(startIndex):trim():clone({ kind = "text" }),
      element:clone({ kind = "backspace", extraProps = { deleteCount = 1 } }),
      element:clone({ kind = "text", value = "</code></pre>" .. nl }),
    }
  end,
  list = function(element)
    return P.splitList(element)
  end,
  items = function(element)
    return P.splitItems(element)
  end,
  itempart = function(element)
    return P.splitTokens(element)
  end,
  I = function(element)
    local _, startIndex, endIndex, _ = P.findFormattingCode(element)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ value = "<em id=\"data-source-line-" .. row .. "\">", kind = "text" }) },
    P.splitTokens(element:sub(startIndex, endIndex):trim()),
    { element:clone({ value = "</em>", kind = "text" }) }
    )
  end,
  B = function(element)
    local _, startIndex, endIndex, _ = P.findFormattingCode(element)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ value = "<strong id=\"data-source-line-" .. row .. "\">", kind = "text" }) },
    P.splitTokens(element:sub(startIndex, endIndex):trim()),
    { element:clone({ value = "</strong>", kind = "text" }) }
    )
  end,
  C = function(element)
    local _, startIndex, endIndex, _ = P.findFormattingCode(element)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ value = "<code id=\"data-source-line-" .. row .. "\">", kind = "text" }) },
    P.splitTokens(element:sub(startIndex, endIndex):trim()),
    { element:clone({ value = "</code>", kind = "text" }) }
    )
  end,
  L = function(element)
    local _, startIndex, endIndex, _ = P.findFormattingCode(element)
    local newElement = element:sub(startIndex, endIndex)
    local b, e = newElement:find("[^|]*|")
    local row = P.indexToRowCol(element.source, element.startIndex)
    if b then
      return P.append(
      { element:clone({ value = '<a href="', kind = "text" }) },
      P.splitTokens(newElement:sub(e + 1)),
      { element:clone({ value = '" id="data-source-line-' .. row .. '">', kind = "text" }) },
      P.splitTokens(newElement:sub(b, e - 1)),
      { element:clone({ value = "</a>", kind = "text" }) }
      )
    else
      return P.append(
      { element:clone({ value = '<a href="', kind = "text" }) },
      P.splitTokens(newElement),
      { element:clone({ value = '" id="data-source-line-' .. row .. '">', kind = "text" }) },
      P.splitTokens(newElement),
      { element:clone({ value = "</a>", kind = "text" }) }
      )
    end
  end,
  E = function(element)
    local _, startIndex, endIndex, _ = P.findFormattingCode(element)
    local value = element:sub(startIndex, endIndex):trim().value
    return {
      element:clone({ value = "&" .. value .. ";", kind = "text" }),
    }
  end,
  X = function(element)
    local _, startIndex, endIndex, _ = P.findFormattingCode(element)
    local row = P.indexToRowCol(element.source, element.startIndex)
    return P.append(
    { element:clone({ value = '<a name=">', kind = "text" }) },
    P.splitTokens(element:sub(startIndex, endIndex):trim()),
    { element:clone({ value = '" id="data-source-line-' .. row .. '">', kind = "text" }) },
    { element:clone({ value = "</a>", kind = "text" }) }
    )
  end,
  Z = function(element)
    return {}
  end,
})

return P.PodiumProcessor.new(html)
