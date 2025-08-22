package com.expensetracker.util;

import java.util.regex.Pattern;

public class MerchantNormalizer {
    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");
    private static final Pattern TRAILING_NUM = Pattern.compile("^(.*?)(?:[#*\n\r\t -]*[0-9]{2,}|[0-9]{4,})$");
    private static final Pattern COMMON_SUFFIX = Pattern.compile("(?i)\\b(inc|llc|ltd|co|corp|company|store|shop)\\b");
    private static final Pattern CARD_SUFFIX = Pattern.compile("(?i)(visa|mastercard|amex|debit|credit)");
    private static final Pattern SPECIALS = Pattern.compile("[^A-Za-z0-9&'+ ]");

    public static String normalize(String raw){
        if(raw==null) return null;
        String s = raw.trim();
        if(s.isEmpty()) return null;
        // remove extraneous whitespace
        s = MULTI_SPACE.matcher(s).replaceAll(" ");
        // drop long numeric suffixes (receipts, ref numbers)
        var m = TRAILING_NUM.matcher(s);
        if(m.matches()){
            String g1 = m.group(1).trim();
            if(g1.length()>3) s = g1;
        }
        // remove leading POS / ATM / ONLINE markers
        s = s.replaceFirst("(?i)^(pos|atm|online|web|purchase|debit|credit)[: -]+"," ");
        // remove common card words at end
        s = CARD_SUFFIX.matcher(s).replaceAll("");
        // remove punctuation except allowed
        s = SPECIALS.matcher(s).replaceAll(" ");
        s = MULTI_SPACE.matcher(s).replaceAll(" ");
        // remove corporate suffix words (keep one instance)
        s = COMMON_SUFFIX.matcher(s).replaceAll("");
        s = MULTI_SPACE.matcher(s).replaceAll(" ");
        s = s.trim();
        if(s.length()>64) s = s.substring(0,64).trim();
        if(s.isBlank()) return null;
        // title case simple
        s = toTitleCase(s);
        return s;
    }

    private static String toTitleCase(String in){
        StringBuilder sb = new StringBuilder(in.length());
        boolean cap=true; for(char c: in.toCharArray()){
            if(Character.isWhitespace(c)){ sb.append(c); cap=true; }
            else { sb.append(cap? Character.toUpperCase(c): Character.toLowerCase(c)); cap=false; }
        }
        return sb.toString();
    }
}